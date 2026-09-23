
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
/**
 * "static" sends every selected tool on every turn. "exploration" shows names only and lets the autonomous agent promote the ones it needs — use it when the selection is large.
 */
export type ToolDisclosure = "static" | "exploration";
export type ClientId = string;
export type UserId = string;
export type UserName = string;
/**
 * Admins of the owning organization are always allowed. Anyone listed here borrows this autonomous agent's permissions.
 */
export type UsersAllowedToInstruct = {
  userId: UserId;
  userName?: UserName;
}[];
export type Enabled = boolean;

export type AutonomousAgent = {
  title: Name;
  persona: Persona;
  instructions?: Instructions;
  mcpServers: MCPServers;
  toolDisclosure: ToolDisclosure;
  nhi?: NonHumanIdentity;
  instructors?: UsersAllowedToInstruct;
  enabled: Enabled;
}
export type NonHumanIdentity = {
  clientId: ClientId;
}

