
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type Name = string;
/**
 * Who this autonomous agent is: its role, tone and scope. Becomes the system prompt.
 */
export type Persona = string;
/**
 * How it should work: procedures, constraints, what to do when unsure.
 */
export type Instructions = string;
export type Server = string;
/**
 * Leave empty to expose every tool this server offers.
 */
export type OnlyTheseTools = string[];
/**
 * Picked from the servers configured for this deployment.
 */
export type MCPServers = {
  serverId: Server;
  toolFilter?: OnlyTheseTools;
}[];
export type ClientId = string;
export type AccessRef =
  UnMembreDeLOrganisation | UnEmail | UneOrganisationPartenaire | UnRoleOuDepartementDeMonOrganisation;
export type Membre = string;
export type AdresseMail = string;
export type Partenaire = string;
export type Departement = string;
export type Roles = string[];
/**
 * Admins of the owning organization are always allowed. Anyone matched here borrows this autonomous agent's permissions.
 */
export type WhoMayInstruct = AccessRef[];
export type Reading = (Allow | ApproveEachCall | NeverOffer) & string;
export type Allow = "allow";
export type ApproveEachCall = "approve";
export type NeverOffer = "deny";
export type Writing = (Allow1 | ApproveEachCall1 | NeverOffer1) & string;
export type Allow1 = "allow";
export type ApproveEachCall1 = "approve";
export type NeverOffer1 = "deny";
export type Destructive = (Allow2 | ApproveEachCall2 | NeverOffer2) & string;
export type Allow2 = "allow";
export type ApproveEachCall2 = "approve";
export type NeverOffer2 = "deny";
/**
 * The agent keeps notes it reuses in every later conversation, and tidies them once a day from what people told it. Administrators can read, edit and restore this memory. Memory writes are not subject to the approval settings: every change is versioned and can be restored.
 */
export type KeepAMemoryAcrossConversations = boolean;
/**
 * The agent can read pages, feeds and sitemaps under the allowed URLs, and ask an administrator of the organization, in a conversation, to allow more.
 */
export type ReadWebPages = boolean;
/**
 * An address can be read when it starts with one of these: "https://github.com/data-fair" allows the repositories of that organization only, "https://www.data.gouv.fr/" the whole site. A site's robots.txt, sitemaps and search description are readable as soon as one of its addresses is allowed.
 *
 * @maxItems 100
 */
export type AllowedURLs = string[];
export type URL = string;
/**
 * Public MCP servers the agent uses anonymously — another data portal, on this platform or elsewhere. Their authors write the descriptions the agent reads, and what it sends them leaves the platform: like web access, this lets them in effect instruct the agent.
 *
 * @maxItems 50
 */
export type ExternalMCPServers = {
  url: URL;
}[];
export type Enabled = boolean;

export type AutonomousAgent = {
  id: string;
  owner: {
    type: "organization";
    id: string;
    name?: string;
    department?: string;
  };
  title: Name;
  persona: Persona;
  instructions?: Instructions;
  mcpServers: MCPServers;
  nhi?: NonHumanIdentity;
  instructors?: WhoMayInstruct;
  approvals?: Approvals;
  memory?: Memory;
  web?: WebAccess;
  externalMcpServers?: ExternalMCPServers;
  enabled: Enabled;
  memoryConsolidation?: {
    at?: string;
    until?: string;
    failedAt?: string;
    deferredAt?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    name?: string;
  };
}
export type NonHumanIdentity = {
  clientId: ClientId;
  siteUrl?: string;
  issuer?: string;
}
export type UnMembreDeLOrganisation = {
  mode: "member";
  type: "user";
  id: Membre;
}
export type UnEmail = {
  mode: "member";
  type: "user";
  email: AdresseMail;
}
export type UneOrganisationPartenaire = {
  mode: "member";
  type: "organization";
  department?: "*";
  roles?: string[];
  id: Partenaire;
}
export type UnRoleOuDepartementDeMonOrganisation = {
  mode: "internal";
  type: "organization";
  id: string;
  department?: Departement;
  roles?: Roles;
}
/**
 * What happens when this autonomous agent calls a tool, by the kind of action the tool declares. "Approve" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.
 */
export type Approvals = {
  readOnly?: Reading;
  write?: Writing;
  destructive?: Destructive;
}
export type Memory = {
  enabled: KeepAMemoryAcrossConversations;
}
/**
 * Pages under the allowed URLs are read by the agent as text, and text can contain instructions: their authors can in effect instruct this agent, with its identity and all its tools, and make it send information out. Enable this only on agents with very restricted write and administration capabilities.
 */
export type WebAccess = {
  enabled: ReadWebPages;
  allowedUrls?: AllowedURLs;
}

