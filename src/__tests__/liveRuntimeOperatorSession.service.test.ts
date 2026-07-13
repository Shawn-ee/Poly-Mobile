import { buildLocalLiveRuntimeOperatorSession } from "@/server/services/liveRuntimeOperatorSession";

describe("live runtime operator session service", () => {
  test("maps admin user to review-only operator capabilities", () => {
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
    expect(status.capabilities.canExecuteSettlement).toBe(false);
    expect(status.capabilities.canRequestSettlementExecutionDryRun).toBe(true);
    expect(status.productionBoundary.executionRouteAvailable).toBe(true);
    expect(status.productionBoundary.executionRouteMode).toBe("guarded_dry_run_no_settlement_mutation");
    expect(status.p1).toEqual(expect.arrayContaining(["direct_settlement_execution_route_disabled"]));
  });
});
