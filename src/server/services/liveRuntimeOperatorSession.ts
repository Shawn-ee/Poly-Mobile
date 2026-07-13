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
      canRequestSettlementExecutionDryRun: roles.includes("admin") || roles.includes("settlement_operator"),
      canViewExactConfirmation: false,
    },
    productionBoundary: {
      authenticatedSessionRouteAvailable: roles.length > 0,
      approvalRouteAvailable: true,
      executionRouteAvailable: true,
      executionRouteMode: "guarded_dry_run_no_settlement_mutation",
      twoPersonApprovalAvailable: false,
      note:
        "This route proves authenticated operator identity for internal settlement review, approval, and guarded execution dry-run requests. Direct settlement execution remains disabled.",
    },
    p0: [],
    p1: [
      "direct_settlement_execution_route_disabled",
      "two_person_or_admin_approval_workflow_missing",
      "dedicated_operator_role_model_missing",
    ],
  };
}
