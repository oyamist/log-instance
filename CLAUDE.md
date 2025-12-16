# log-instance CLAUDE.md

## Objective

Make log-instance compatible with Node 24.x to support OIDC npm publishing in dependent projects (scv-bilara, etc).

## Context

- Current: mocha 10.2.0, no explicit Node version constraints
- Goal: Ensure log-instance works with Node 24.x (npm 11.6.2+)
- Reason: scv-bilara workflows need Node 24 for OIDC token generation with npmjs.org
- log-instance is a dependency of scv-bilara and other modules

## Backlog

1. Test log-instance against Node 24.x locally
2. Update devDependencies if needed (mocha, should, winston)
3. Add Node version constraint to package.json if needed
4. Run full test suite on Node 24.x
5. Publish updated log-instance to npm
