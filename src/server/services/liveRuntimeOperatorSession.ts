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
      canExecuteSettlement: roles.includes("admin"),
      canRequestSettlementExecutionDryRun: roles.includes("admin") || roles.includes("settlement_operator"),
      canViewExactConfirmation: false,
    },
    productionBoundary: {
      authenticatedSessionRouteAvailable: roles.length > 0,
      approvalRouteAvailable: true,
      executionRouteAvailable: true,
      executionRouteMode: "guarded_exact_confirmed_closed_market_execution",
      twoPersonOrAdminPolicyAvailable: true,
      dedicatedProductionRoleModelAvailable: false,
      note:
        "This route proves authenticated operator identity for internal settlement review, approval, and guarded exact-confirmed CLOSED-market execution requests. Production still needs a dedicated settlement-operator role model and UI.",
    },
    p0: [],
    p1: [
      "dedicated_operator_role_model_missing",
      "production_operator_ui_not_present",
      "installed_official_result_polling_missing",
    ],
  };
}
