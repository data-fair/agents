
export const schemaExports: string[]

export declare function validate(data: any): data is AutonomousAgent
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is AutonomousAgent
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): AutonomousAgent
      
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
 * What this server lets the agent do, by profile.
 */
export type Profiles = string[];
/**
 * Leave empty to expose every tool this server offers.
 */
export type OnlyTheseTools = string[];
/**
 * Picked from the servers configured for this deployment.
 */
export type MCPServers = {
  serverId: Server;
  profiles?: Profiles;
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
/**
 * A planned task has nobody to approve: tools that need approval are not offered to it.
 */
export type AskForApprovalFor = (
  | EveryOperationThatMakesChanges
  | OnlyOperationsMarkedAsParticularlyDestructive
  | NoneTheAgentIsFullyAutonomousInItsToolCalls
) &
  string;
export type EveryOperationThatMakesChanges = "write";
export type OnlyOperationsMarkedAsParticularlyDestructive = "destructive";
export type NoneTheAgentIsFullyAutonomousInItsToolCalls = "none";
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
  title: Name;
  persona: Persona;
  instructions?: Instructions;
  mcpServers: MCPServers;
  nhi?: NonHumanIdentity;
  instructors?: WhoMayInstruct;
  approvalLevel?: AskForApprovalFor;
  memory?: Memory;
  web?: WebAccess;
  externalMcpServers?: ExternalMCPServers;
  enabled: Enabled;
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

