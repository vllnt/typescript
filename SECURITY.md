# Security Policy

## Supported versions

Security updates target the latest published `@vllnt/typescript` release on npm.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's security reporting flow for this repository if it is available.

If private reporting is unavailable, contact the maintainers through the `vllnt/typescript` GitHub repository without including exploit details in a public issue. Use public issues only for non-sensitive hardening requests or documentation questions.

## Scope

This package publishes TypeScript configuration files. Security-sensitive areas include:

- configuration changes that weaken type-safety defaults unexpectedly;
- package publishing or provenance configuration changes;
- accidental inclusion of private files in the npm package;
- documentation that encourages unsafe compiler settings for production packages.

## Maintainer response

The maintainer will triage valid reports, prepare a fix when needed, and publish release notes after a safe remediation path exists.
