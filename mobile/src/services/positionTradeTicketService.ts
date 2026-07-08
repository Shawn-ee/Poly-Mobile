import type { Position } from "../components/Portfolio";
import type { BinaryContractSide, TicketSelection } from "../components/TradeTicket";

export type PositionTradeTicketIdentity = {
  selection?: TicketSelection;
  contractSide: BinaryContractSide;
};

const positionContractSide = (position: Position): BinaryContractSide =>
  position.contractSide ?? position.selection?.contractSide ?? "yes";

export const buildPositionTradeTicketIdentity = (position: Position): PositionTradeTicketIdentity => {
  const contractSide = positionContractSide(position);
  return {
    contractSide,
    selection: position.selection
      ? {
          ...position.selection,
          contractSide,
        }
      : undefined,
  };
};
