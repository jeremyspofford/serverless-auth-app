# Welcome to MkDocs

For full documentation visit [mkdocs.org](https://www.mkdocs.org).

## Commands

* `mkdocs new [dir-name]` - Create a new project.
* `mkdocs serve` - Start the live-reloading docs server.
* `mkdocs build` - Build the documentation site.
* `mkdocs -h` - Print help message and exit.

## Project layout

    mkdocs.yml    # The configuration file.
    docs/
        index.md  # The documentation homepage.
        ...       # Other markdown pages, images and other files.

# Serverless Auth Application

## Overview
A complete serverless authentication application built with AWS CDK, Lambda, and LocalStack for local
development.

## Quick Start
- [Project Setup](PROJECT_SETUP_CHEATSHEET.md)
- [Current Status](PROJECT_STATUS.md)
- [CDK Concepts](AWS_CDK_CONCEPTS.md)

## Tech Stack
- **Backend**: AWS Lambda (TypeScript)
- **Infrastructure**: AWS CDK
- **Local Dev**: LocalStack + Docker
- **API**: API Gateway
- **Database**: DynamoDB
- **Auth**: AWS Cognito (planned)
