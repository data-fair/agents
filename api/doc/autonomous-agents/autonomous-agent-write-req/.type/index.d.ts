
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
export type Enabled = boolean;

export type AutonomousAgent = {
  title: Name;
  persona: Persona;
  instructions?: Instructions;
  mcpServers: MCPServers;
  nhi?: NonHumanIdentity;
  instructors?: WhoMayInstruct;
  approvals?: Approvals;
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
/**
 * What happens when this autonomous agent calls a tool, by the kind of action the tool declares. "Approve" stops the turn until the person in the chat approves the call; a scheduled task never gets such a tool. Tools that declare nothing count as writing.
 */
export type Approvals = {
  readOnly?: Reading;
  write?: Writing;
  destructive?: Destructive;
}

