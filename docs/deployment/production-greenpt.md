# Production configuration: GreenPT through LiteLLM, one model per role

Reference values for the global AI config (layer 1 in
[configuration.md](../architecture/configuration.md)) of the first production
release. Every model is served by GreenPT, reached through Koumoul's internal
LiteLLM proxy (`litellm.internal.koumoul.fr`, config in the infrastructure repo
under `manifests/env-internal/litellm/`). Each role gets exactly **one**
model, so the org admin's "Model per role" tab only shows the default.

Labels are what org admins read: the role pickers render
`<model name> (<provider name>)`, e.g. "Default: DeepSeek V4.1 Flash (GreenPT)".
The provider is therefore named after the actual provider, **not** after the
proxy in front of it, even though its `baseURL` is LiteLLM's.

Prices are GreenPT's list prices (€ per million tokens,
[greenpt.com/models](https://greenpt.com/models) and the model guides on
[docs.greenpt.ai](https://docs.greenpt.ai/), checked 2026-09-28). They drive
every credit amount: re-check them before each deployment, and keep them equal
to the `*_cost_per_token` values of the LiteLLM entries.

## Model choice

| Role | Model (GreenPT id) | LiteLLM `model_name` | Why |
|---|---|---|---|
| assistant | `deepseek-v4.1-flash` | `deepseek-v4.1-flash-greenpt` | default agent model, 1M context |
| tools | `deepseek-v4.1-flash` | `deepseek-v4.1-flash-greenpt` | same model as the assistant |
| evaluator | `glm-5.3` | `glm-5.3-greenpt` | GreenPT's flagship for agentic/tool use, highest reasoning |
| summarizer | `glm-5.3-flash` | `glm-5.3-flash-greenpt` | cheapest GreenPT model with tools + reasoning (€0.11 / €0.44), and a 1M context: it summarizes up to 70% of the assistant's window |
| moderator | `glm-5.3-flash` | `glm-5.3-flash-greenpt` | same: fast and cheap, called with `reasoning_effort: none` so thinking is off on the critical path |

The summarizer and moderator are both sent `reasoning_effort: none`, which
requires `allowed_openai_params: ["reasoning_effort"]` on their LiteLLM entry
(the proxy runs with `drop_params: false`).

## LiteLLM entries

The three models are proxied by LiteLLM under the `model_name`s above, with
`allowed_openai_params: ["reasoning_effort"]` and their per-token costs (see
`configmap.yaml` in the infrastructure repo, GreenPT section). A price change
must be applied in both places.

## Environment variables

The API key is a LiteLLM virtual key dedicated to this deployment (created in
the LiteLLM UI), not the GreenPT key.

```
PROVIDERS=[{"type":"openai-compatible","id":"greenpt","name":"GreenPT","enabled":true,"baseURL":"https://litellm.internal.koumoul.fr/v1","compatibility":"compatible","apiKey":"<litellm virtual key>"}]
MODELS=[{"id":"deepseek-v4.1-flash-greenpt","name":"DeepSeek V4.1 Flash","provider":"greenpt","usage":["assistant","tools"],"contextWindow":1000000,"inputPricePerMillion":0.22,"cachedInputPricePerMillion":0.011,"outputPricePerMillion":1.1},{"id":"glm-5.3-greenpt","name":"GLM 5.3","provider":"greenpt","usage":["evaluator"],"contextWindow":1000000,"inputPricePerMillion":1.1,"cachedInputPricePerMillion":0.275,"outputPricePerMillion":4.4},{"id":"glm-5.3-flash-greenpt","name":"GLM 5.3 Flash","provider":"greenpt","usage":["summarizer","moderator"],"contextWindow":1000000,"inputPricePerMillion":0.11,"cachedInputPricePerMillion":0.022,"outputPricePerMillion":0.44}]
DEFAULT_MODELS={"assistant":{"provider":"greenpt","id":"deepseek-v4.1-flash-greenpt"},"tools":{"provider":"greenpt","id":"deepseek-v4.1-flash-greenpt"},"evaluator":{"provider":"greenpt","id":"glm-5.3-greenpt"},"summarizer":{"provider":"greenpt","id":"glm-5.3-flash-greenpt"},"moderator":{"provider":"greenpt","id":"glm-5.3-flash-greenpt"}}
```

Notes:

- `compatibility: "compatible"` targets `/v1/chat/completions`.
- The provider `id` (`greenpt`) and model ids are stored in every org's
  `modelMapping`: keep them stable, rename only the `name`s.
- Every role is mapped in `DEFAULT_MODELS`, so no role goes through the
  fallback chain and each one's model is explicit in the UI.
- Being `openai-compatible` with a `glm` id, the GLM models fall under
  `streamedToolCallsBroken` (`api/src/models/operations.ts`): tool-bearing calls
  (the evaluator's) are issued non-streaming upstream. That workaround targets
  a Scaleway bug; once GreenPT is confirmed to stream GLM tool calls correctly,
  narrow it so it does not apply here.
