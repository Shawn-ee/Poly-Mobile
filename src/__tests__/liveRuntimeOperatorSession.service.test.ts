import { buildLocalLiveRuntimeOperatorSession } from "@/server/services/liveRuntimeOperatorSession";

describe("live runtime operator session service", () => {
  test("maps admin user to guarded local operator capabilities", () => {
    const status = buildLocalLiveRuntimeOperatorSession({
      id: "admin-user-1",
      email: "admin@example.test",
      username: "admin",
      isAdmin: true,
    });

    expect(status.status).toBe("ready");
    expect(status.operator.roles).toEqual(["admin", "settlement_operator"]);
    expect(status.operator.durableIdentityAvailable).toBe(true);
    expect(status.capabilities.canReviewSettlementQueue).toBe(true);
    expect(status.capabilities.canApproveSettlement).toBe(true);
    expect(status.capabilities.canExecuteSettlement).toBe(true);
    expect(status.capabilities.canRequestSettlementExecutionDryRun).toBe(true);
    expect(status.productionBoundary.executionRouteAvailable).toBe(true);
    expect(status.productionBoundary.executionRouteMode).toBe("guarded_exact_confirmed_closed_market_execution");
    expect(status.productionBoundary.twoPersonOrAdminPolicyAvailable).toBe(true);
    expect(status.productionBoundary.dedicatedProductionRoleModelAvailable).toBe(false);
    expect(status.p1).toEqual(
      expect.arrayContaining([
        "dedicated_operator_role_model_missing",
        "production_operator_ui_not_present",
        "installed_official_result_polling_missing",
      ]),
    );
  });
});
