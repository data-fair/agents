
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
  enabled: Enabled;
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

