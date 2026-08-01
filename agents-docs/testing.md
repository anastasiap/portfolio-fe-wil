You are writing Angular 17 unit tests for this project using Karma + Jasmine.

Your task is to create focused tests for one selected template element or one selected UI behaviour, but the tests must run inside the real component test setup and account for the whole component's dependencies.

Follow the repository Copilot instructions and existing local spec style.

Before writing code:
1. Inspect the selected template code.
2. Inspect the full component TypeScript file.
3. Inspect the full component template.
4. Inspect the existing spec file if it exists.
5. Inspect any services, stores, facades, pipes, directives, child components, guards, or modules required for the component to compile.
6. Identify the selected behaviour visible to the user.
7. Propose a short test plan first.
8. Do not implement until the user confirms which tests to write.

Testing rules:
- Use TestBed + createComponent.
- The test suite must compile the whole component, not only the selected HTML fragment.
- Set up every dependency required by the component.
- Do not ignore unrelated constructor/template dependencies if they are required for compilation.
- Call fixture.detectChanges() to run lifecycle.
- Do not call ngOnInit, ngOnChanges, or ngOnDestroy directly.
- Use Arrange → Act → Assert inside every it(...) block.
- Prefer DOM-based tests.
- Prefer By.css with data-testid selectors.
- Do not test private methods.
- Do not call template-triggered component methods directly.
- Mock services, stores, facades, pipes, directives, child components, and router dependencies according to existing local patterns.
- Do not use real HTTP calls.
- Do not rewrite production code unless the component is impossible to test; if so, explain the testability issue first.
- Do not add unrelated tests.
- Do not create broad fake coverage.
- Keep the diff minimal.
- Add only tests related to the selected element or selected behaviour.
- Wrap each logical suit in describe() block.
- For route guards use fakeAsync and tick for async navigation
- For route guards test edge cases (null roles, undefined states)
- For route guards test redirect URLs preserve returnUrl parameters
- Use RouterTestingModule for integration tests
- Don't test the Router itself - test your guards' logic
- Test both sync and async guards (Promise/Observable returns)
- Verify navigation calls with specific parameters

Validation rules:
- After implementing tests, run the relevant test command.
- If the test command fails, inspect the failure and fix the test setup or test logic.
- Repeat until the targeted component spec is green.
- Do not weaken assertions just to make tests pass.
- Do not remove meaningful existing tests.
- If failure reveals a real production bug, stop and report it instead of hiding it in the test.
- Report the exact command run and the final result.

When implementing:
1. Update or create the component spec file.
2. Add only the requested tests.
3. Keep existing tests intact.
4. Follow existing naming and setup style.
5. If the component uses observables, control them through mock subjects or existing mock patterns.
6. If translations are used, use the existing translate testing pattern from the project.
7. Ensure the full component compiles before considering the task done.

Output format:
1. Brief test plan
2. Test implementation
3. Test command run
4. Final test result
5. Assumptions
6. Any production-code testability issue
