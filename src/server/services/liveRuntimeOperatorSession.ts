type OperatorUser = {
  id: string;
  email: string | null;
  username: string | null;
  isAdmin: boolean;
};

export function buildLocalLiveRuntimeOperatorSession(user: OperatorUser) {
  const roles = user.isAdmin ? ["admin", "settlement_operator"] : [];

  return {
    status: roles.length > 0 ? "ready" : "forbidden",
    checked: true,
    route: "GET /api/internal/operator/session",
    mutatesState: false,
    providerQuotaRequired: false,
    publicMobileRoute: false,
    exactConfirmationExposed: false,
    operator: {
      id: user.id,
      email: user.email,
      username: user.username,
      roles,
      roleSource: "User.isAdmin",
      durableIdentityAvailable: true,
    },
    capabilities: {
      canReviewSettlementQueue: roles.includes("admin") || roles.includes("settlement_operator"),
      canApproveSettlement: roles.includes("admin") || roles.includes("settlement_operator"),
      canExecuteSettlement: false,
      canViewExactConfirmation: false,
    },
    productionBoundary: {
      authenticatedSessionRouteAvailable: roles.length > 0,
      approvalRouteAvailable: true,
      executionRouteAvailable: false,
      twoPersonApprovalAvailable: false,
      note:
        "This route proves authenticated operator identity for internal settlement review and approval. Execution controls remain disabled until a dedicated guarded route exists.",
    },
    p0: [],
    p1: [
      "settlement_execution_route_missing",
      "two_person_or_admin_approval_workflow_missing",
      "dedicated_operator_role_model_missing",
    ],
  };
}
