# Zonke.me Cardano Escrow Payment System

> **Complete Development, Setup and Technical Reference**

**Project:** Zonke.me
**Component:** Cardano Blockchain Escrow Payment System
**Blockchain:** Cardano
**Development Network:** Cardano Preprod
**Smart Contract Language:** Aiken
**Smart Contract Platform:** Plutus V3
**Aiken Version:** v1.1.23
**Aiken Standard Library:** v3.0.0
**Wallet Target:** Coxy Wallet using CIP-30
**Current Status:** Smart contract tested and compiled; off-chain and wallet integration still in development

---

## 🎯 1. Project Purpose

The purpose of this project is to integrate a real Cardano blockchain escrow payment system into the existing Zonke.me hiring and payment process.

The project is not intended to create a separate Cardano demonstration.

The objective is to connect the existing Zonke.me platform to Cardano so that a client can pay a developer using ADA and have the payment controlled by a smart contract.

The intended flow is:

Client hires developer
↓
Existing Zonke payment process
↓
Cardano payment option
↓
Coxy Wallet
↓
Client approves ADA transaction
↓
Cardano Preprod
↓
Zonke Escrow Smart Contract
↓
ADA is locked
↓
Developer completes work
↓
Client approves work
↓
Smart contract releases ADA
↓
Developer receives ADA

---

## 2. Why We Are Building an Escrow

An escrow temporarily holds money until specific conditions are met.

For Zonke.me, the smart contract acts like a digital escrow box.

The client deposits ADA into the escrow.

The smart contract then controls when the ADA can be released.

The simplified process is:

Client
↓
ADA payment
↓
Escrow Smart Contract
↓
ADA locked
↓
Work completed
↓
Client approval
↓
Developer receives ADA

The contract also contains alternative paths for cancellation, refunds, disputes and timeouts.

---

## 3. Important Development Principle

The project must use real blockchain transactions.

We should not create a fake payment system where the website simply displays:

"Payment Successful"

without a real Cardano transaction.

The eventual system must:

1. Create a real Cardano transaction.
2. Ask the user's wallet to sign it.
3. Submit the transaction to Cardano Preprod.
4. Obtain the real transaction ID.
5. Allow the backend to verify the transaction.
6. Record the verified payment against the Zonke job/payment.

The website is therefore only one part of the system.

---

## 🧰 4. Technologies Being Used

### Cardano

Cardano is the blockchain on which the payment and smart contract operate.

For development, the project uses Cardano Preprod.

---

### ADA

ADA is Cardano's native cryptocurrency.

ADA is the currency that will be deposited into and released from the escrow.

During development we use test ADA on Preprod.

---

### Cardano Preprod

Preprod is a Cardano test network.

It allows developers to test transactions and smart contracts without using real ADA.

The development and testing phase should remain on Preprod.

---

### Aiken

Aiken is the programming language used to write the Cardano smart contract.

Our selected version is:

`v1.1.23`

---

### Plutus V3

Plutus is Cardano's smart-contract platform.

Aiken code is compiled into Plutus code that can be executed by Cardano.

This project uses:

`Plutus V3`

The simplified process is:

Aiken source code
↓
Aiken compiler
↓
Plutus V3 validator
↓
Cardano blockchain

---

### Coxy Wallet

Coxy Wallet is the intended Cardano wallet for the Zonke payment process.

The website will communicate with the wallet through the Cardano wallet integration standard CIP-30.

The exact Coxy browser API name must be confirmed during implementation.

We should not invent a wallet API name.

---

### CIP-30

CIP-30 is a Cardano standard that allows web applications to communicate with Cardano wallets.

The website can request:

* Wallet connection
* Wallet address information
* Network information
* Transaction signing

The user's private key should remain inside the wallet.

The Zonke website must never request or store the user's seed phrase or private key.

---

## 🛠️ 5. Initial Windows Development Environment

The smart contract was developed on Windows using:

* Windows
* PowerShell
* Visual Studio Code
* Aiken
* Aikup
* Aiken VS Code extension

The project was stored under:

`C:\Users\user\Downloads\zonke_escrow`

Inside that directory, the actual Aiken project was:

`C:\Users\user\Downloads\zonke_escrow\zonke_escrow`

The extra folder level happened because the project folder contained another `zonke_escrow` directory.

The actual working directory is:

`C:\Users\user\Downloads\zonke_escrow\zonke_escrow`

---

## 6. Installing and Checking Winget

Windows Package Manager was available on the computer.

The first command used was:

```powershell
winget --version
```

The result was:

```text
v1.29.380
```

This confirmed that Winget was installed.

A search for Aiken was also attempted:

```powershell
winget search Aiken
```

Winget requested acceptance of the Microsoft Store agreement.

The agreement was accepted.

The search did not provide a suitable Aiken package, so another installation method was used.

---

## 7. Installing Aiken Through Aikup

The official Aiken installer was used.

The installation command was:

```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://windows.aiken-lang.org | iex"
```

The installer reported:

```text
Downloading aikup 0.0.11 (x86_64-pc-windows-msvc)
Installing to C:\Users\user\.aiken\bin
aikup.exe
Everything's installed!
C:\Users\user\.aiken\bin was added to your PATH, you may need to restart your shell for that to take effect.
```

---

## 8. What Is Aikup?

Aikup is a tool used to install and manage Aiken versions.

It allows a developer to install a specific Aiken version instead of relying on whichever version happens to be installed globally.

This is useful because smart-contract projects should use known versions.

Our project uses:

`Aiken v1.1.23`

---

## 9. PATH Problem After Installing Aikup

After installation, a new PowerShell session initially did not recognise `aikup`.

The installation itself was successful, but the current shell had not picked up the updated PATH.

We checked whether the executable existed:

```powershell
Test-Path "$HOME\.aiken\bin\aikup.exe"
```

The result was:

```text
True
```

This confirmed that Aikup was actually installed.

---

## 10. Temporarily Adding Aikup to PATH

The following command was used in the PowerShell session:

```powershell
$env:Path += ";$HOME\.aiken\bin"
```

After this, the version was checked:

```powershell
aikup --version
```

The result was:

```text
aikup 0.0.11
```

This confirmed that Aikup was working.

---

## 11. Installing the Required Aiken Version

The project was designed to use Aiken v1.1.23.

The installation command was:

```powershell
aikup install v1.1.23
```

Aikup reported:

```text
aikup: installing v1.1.23
aikup: downloading v1.1.23
aikup: installed v1.1.23
aikup: switched v1.1.23
```

There was also a message indicating that Aiken was already in PATH but was not managed by Aikup.

The important result was that Aikup successfully installed and switched to:

`v1.1.23`

---

## 12. Confirming Aiken

The Aiken version was checked using:

```powershell
aiken --version
```

The result was:

```text
aiken v1.1.23+8949565
```

The Aiken executable was also checked:

```powershell
Get-Command aiken
```

The result showed:

```text
C:\Users\user\.aiken\bin\aiken.exe
```

This confirmed that the correct Aiken executable was being used.

---

## 13. VS Code Aiken Extension

The Aiken extension for Visual Studio Code was installed so that `.ak` files could be recognised as Aiken files.

Initially, the extension produced this error:

```text
Aiken Language Server client: couldn't create connection to server.
Launching server using command aiken failed.
Error: spawn aiken ENOENT
```

`ENOENT` in this situation means that VS Code could not find the `aiken` executable through its current PATH.

The Aiken installation itself was not necessarily broken.

The problem was that the VS Code terminal/session had not picked up the Aiken PATH.

---

## 14. Fixing Aiken PATH in the VS Code Terminal

Inside the VS Code PowerShell terminal, the following command was used:

```powershell
$env:Path += ";$HOME\.aiken\bin"
```

This made the Aiken executable available to that terminal session.

Aiken could then be executed normally.

If a future terminal cannot find Aiken, first check:

```powershell
aiken --version
```

If it is not recognised, check:

```powershell
Test-Path "$HOME\.aiken\bin\aiken.exe"
```

If the result is `True`, the executable exists and the issue is likely the current PATH/session.

---

## 15. Entering the Correct Project Directory

The outer directory contained another `zonke_escrow` directory.

The actual Aiken project was:

```text
C:\Users\user\Downloads\zonke_escrow\zonke_escrow
```

The working directory was entered using:

```powershell
cd .\z*
```

The directory was then checked using:

```powershell
Get-ChildItem
```

The project contained:

```text
lib
validators
aiken.toml
```

This was important because Aiken commands such as `aiken check` and `aiken build` must be run from the directory containing `aiken.toml`.

---

## 16. Aiken Project Configuration

The project uses the following `aiken.toml` configuration:

```toml
name = "zonke/escrow"
version = "0.1.0"
compiler = "v1.1.23"
plutus = "v3"
license = "Apache-2.0"
description = "Zonke.me freelance escrow validator (Cardano, Plutus V3)"

[repository]
user = "zonke"
project = "escrow"
platform = "github"

[[dependencies]]
name = "aiken-lang/stdlib"
version = "v3.0.0"
source = "github"
```

---

## 17. Why Aiken v1.1.23 Was Selected

The project was intentionally fixed to:

Aiken v1.1.23

with:

Aiken Standard Library v3.0.0

We did not move to Aiken v1.1.24 or Standard Library v4.x because the v4 standard library is a breaking release and the current project code was designed around the v3 API.

Keeping the compiler and library versions fixed makes future builds more predictable.

---

## 🧩 18. Smart Contract Project Structure

The project currently has:

```text
zonke_escrow/
│
├── aiken.toml
├── plutus.json
│
├── lib/
│   └── escrow/
│       ├── types.ak
│       ├── util.ak
│       ├── logic.ak
│       └── logic_tests.ak
│
└── validators/
    └── zonke_escrow.ak
```

---

## 19. `types.ak`

Location:

```text
lib/escrow/types.ak
```

This file defines the data structures used by the escrow.

The main datum is:

`EscrowDatum`

It contains:

* `payment_ref`
* `client`
* `developer`
* `accept_deadline`
* `work_deadline`
* `review_window`
* `dispute_window`
* `status`

The file also defines the escrow statuses:

* Funded
* Accepted
* Delivered
* Disputed

It defines the redeemers/actions:

* Accept
* Cancel
* Deliver
* Approve
* Claim
* Refund
* Dispute
* Resolve
* TimeoutFallback

---

## 20. What Is a Datum?

A datum is information associated with a smart-contract UTxO.

For our project, it describes the state and information belonging to a particular escrow.

For example:

```text
Client = Client Cardano address
Developer = Developer Cardano address
Status = Funded
Work deadline = specified time
```

The smart contract reads this information when deciding whether a transaction is valid.

---

## 21. What Is a Redeemer?

A redeemer tells the validator which action is being requested.

For example:

```text
Accept
```

means that the developer is attempting to accept the job.

Another example:

```text
Approve
```

means that the client is attempting to approve the completed work.

The validator checks whether that action is allowed from the current escrow state.

---

## 22. `util.ak`

Location:

```text
lib/escrow/util.ak
```

This file contains helper functions.

The helpers deal with:

* Transaction validity range
* Script outputs
* Payment values
* Value comparisons
* Lovelace checking
* ADA-only checks

Separating these functions keeps the main escrow logic easier to understand.

---

## 23. `logic.ak`

Location:

```text
lib/escrow/logic.ak
```

This is the main escrow state-machine logic.

It checks:

* Client signatures
* Developer signatures
* Arbiter signature
* Escrow state
* Deadlines
* Script inputs
* Script outputs
* ADA values
* Native assets
* Payment destinations
* Disputes
* Timeout rules

The validator delegates the main validation work to this file.

---

## 🔄 24. The Escrow State Machine

The escrow follows controlled state transitions.

The main flow is:

```text
Funded
   │
   └── Accept
          ↓
       Accepted
          │
          └── Deliver
                 ↓
              Delivered
                 │
                 └── Approve
                        ↓
                   Developer paid
```

There are alternative paths.

```text
Funded
 ├── Cancel → Client refunded
 │
 └── Accept → Accepted
                 ├── Deliver → Delivered
                 │               ├── Approve → Developer paid
                 │               └── Claim → Developer paid
                 │
                 ├── Refund → Client refunded
                 │
                 └── Dispute → Disputed
                                  ├── Resolve
                                  └── TimeoutFallback → Client refunded
```

---

## 25. Escrow Action Rules

### Accept

The developer accepts the job.

Required:

* Escrow must be Funded.
* Developer must sign.
* Transaction must be within the acceptance deadline.

State:

```text
Funded → Accepted
```

---

### Cancel

The client cancels the funded escrow.

Required:

* Escrow must be Funded.
* Client must sign.
* Escrow output must disappear.
* The client's address must receive the locked value.

Result:

```text
Funded → Client refunded
```

---

### Deliver

The developer marks the work as delivered.

Required:

* Escrow must be Accepted.
* Developer must sign.
* Transaction must be before the work deadline.

The contract creates a review deadline.

State:

```text
Accepted → Delivered
```

---

### Approve

The client approves the completed work.

Required:

* Client must sign.
* Escrow must be in an open state.
* Escrow must be spent.
* Developer must receive the locked value.

Result:

```text
Developer receives ADA
```

---

### Claim

The developer claims the payment after the review deadline.

Required:

* Escrow must be Delivered.
* Developer must sign.
* Review deadline must have passed.
* Developer receives the locked value.

---

### Refund

The client receives a refund after the required deadline.

The refund is not immediately available simply because the developer has not completed the work.

The contract checks the required time conditions.

---

### Dispute

A dispute moves the escrow into:

```text
Disputed
```

The rules determine who can initiate the dispute depending on the current state and time.

The dispute creates a resolve deadline.

---

### Resolve

The arbiter resolves a dispute.

The redeemer contains:

```text
client_payout
developer_payout
```

The contract checks that:

```text
client payout + developer payout
=
ADA locked in escrow
```

The current Resolve design is ADA-only.

---

### TimeoutFallback

If the dispute remains unresolved until the resolve deadline, the timeout fallback can return the escrow value to the client.

Either the client or developer can trigger this action after the required timeout.

---

## 26. The Arbiter

The arbiter is the trusted dispute-resolution authority.

The arbiter is a parameter of the validator.

It is not stored in each escrow datum.

This means the arbiter is associated with the particular parameterised version of the smart contract.

If a different arbiter is selected, a different parameterised script/address can be produced.

The current validator expects the arbiter to be a verification-key credential.

---

## 27. Value Protection

The smart contract checks the value being held by the escrow.

For continuing escrow states, the script output must:

* Remain at the same script address.
* Contain the same value.
* Contain the expected inline datum.

This prevents a continuing escrow transaction from silently reducing the locked value.

For terminal actions, the contract checks that the required recipient receives the locked value.

Native assets are also considered for normal escrow transitions.

Resolve is restricted to ADA-only.

---

## 28. Signature Protection

Different actions require different signers.

Developer actions include:

* Accept
* Deliver
* Claim

Client actions include:

* Cancel
* Approve
* Refund

Dispute and timeout actions have their own signer rules.

Resolve requires the arbiter.

The contract also rejects a client or developer address whose payment credential is a script instead of the required verification key credential.

---

## 29. Time Rules

The contract uses transaction validity ranges.

Important time rules include:

#### Accept

The transaction must be within the acceptance deadline.

#### Deliver

The transaction must occur before the work deadline.

#### Claim

The review deadline must have passed.

#### Refund

The required work/dispute period must have passed.

#### Dispute

Different rules apply depending on whether the escrow is Accepted or Delivered.

#### Resolve

The arbiter can resolve the dispute without a timing restriction.

#### TimeoutFallback

The resolve deadline must have passed.

These rules are checked by the validator.

---

## 30. What Is a Validity Range?

A Cardano transaction can specify the period during which it is valid.

The validator can inspect this period.

Our contract uses the upper and lower bounds of the transaction validity range to check time-related rules.

The tests also cover transactions with missing/unbounded time information.

The contract deliberately rejects cases where the required finite time boundary is unavailable.

---

## 🧪 31. Testing the Smart Contract

The file:

```text
lib/escrow/logic_tests.ak
```

contains the tests for the escrow logic.

We created tests for both valid and invalid situations.

Examples include:

* Accept
* Cancel
* Deliver
* Approve
* Claim
* Refund
* Dispute
* Resolve
* TimeoutFallback
* Invalid deadlines
* Missing datum
* Missing escrow input
* Incorrect credentials
* Invalid arbiter
* Invalid value conditions

---

## 32. Running the Tests

The command used was:

```powershell
aiken check
```

Aiken compiled the project and ran the test suite.

The final result was:

```text
96 tests | 96 passed | 0 failed
Summary 96 checks, 0 errors, 0 warnings
```

This is an important project milestone.

It means all 96 test cases currently defined for the escrow logic passed.

Some tests are intentionally designed to verify that invalid transactions are rejected.

A test labelled as a rejection test can still count as a passing test when the contract correctly rejects the invalid situation.

---

## 33. What Does `aiken check` Mean?

`aiken check` is used to check the Aiken project and execute its tests.

It is useful during development because it allows the developer to find problems before building and deploying the smart contract.

The successful result was:

```text
96 checks
0 errors
0 warnings
```

---

## 34. Building the Smart Contract

After all tests passed, the following command was run:

```powershell
aiken build
```

Aiken produced:

```text
Compiling zonke/escrow 0.1.0
Compiling aiken-lang/stdlib v3.0.0
Generating project's blueprint
Summary 0 errors, 0 warnings
```

The generated blueprint is:

```text
plutus.json
```

---

## 35. What Is `aiken build`?

`aiken build` compiles the Aiken smart contract.

It converts the project into a compiled representation that can be used for Cardano smart-contract integration.

It also generates the project's blueprint.

The build completed with:

```text
0 errors
0 warnings
```

---

## 36. What Is `plutus.json`?

`plutus.json` is the generated project blueprint.

It describes the compiled validator and its data structures.

It contains information such as:

* Project information
* Plutus version
* Aiken compiler version
* Validator name
* Validator parameter
* Datum schema
* Redeemer schema
* Compiled validator code
* Validator hash

The blueprint reports:

```text
Plutus V3
Aiken v1.1.23+8949565
```

---

## 37. Validator Name

The blueprint identifies the spending validator as:

```text
zonke_escrow.zonke_escrow.spend
```

The parameter is:

```text
arbiter
```

The validator receives the arbiter as a parameter.

---

## 38. Validator Hash

The generated blueprint contains this validator hash:

```text
5ac1979e67011c45a5214e2e32a87b827f27f64e8248203bdf7c9b88
```

This hash identifies the compiled validator.

It will be relevant when deriving and working with the parameterised Cardano script address.

The final script address must be generated using the correct network and arbiter parameter.

---

## 39. `validators/zonke_escrow.ak`

The main validator file is:

```text
validators/zonke_escrow.ak
```

Its job is to connect the parameterised validator to the main escrow logic.

The important structure is:

```aiken
validator zonke_escrow(arbiter: Credential) {

  spend(
    datum: Option<EscrowDatum>,
    redeemer: Redeemer,
    own_ref: OutputReference,
    self: Transaction,
  ) {

    logic.validate(arbiter, datum, redeemer, own_ref, self)

  }

  else(_) {
    fail
  }
}
```

In simple terms:

The validator receives the Cardano transaction information and sends it to the escrow rules in `logic.ak`.

---

## 40. Why We Separate the Validator and Logic

The project separates:

```text
validators/zonke_escrow.ak
```

from:

```text
lib/escrow/logic.ak
```

The validator is the entry point.

The logic file contains the detailed rules.

This made it possible to test the main escrow logic independently.

It also makes future maintenance easier.

---

## 41. Important Correction During Development

During development, some Aiken source files initially contained formatting characters copied from the chat interface.

For example, Markdown formatting such as:

```text
*field:*
```

or escaped characters could accidentally appear in the source code.

These were removed.

The source files were then corrected so that they contained actual Aiken syntax.

The project eventually reached:

```text
96 tests | 96 passed | 0 failed
```

This confirmed that the corrected source was compiling and testing correctly.

---

## 42. Another Aiken Compatibility Fix

The project originally had type syntax that did not match the installed Aiken version.

The tests were corrected so that:

```text
Interval<Int>
```

was changed to:

```text
Interval
```

This matched the Aiken v1.1.23/stdlib v3 environment.

After the correction, the test suite passed.

---

## 43. Current Smart Contract Status

The current smart-contract stage is:

```text
Aiken source
     ↓
Escrow logic
     ↓
Automated tests
     ↓
96/96 tests passed
     ↓
Aiken build
     ↓
Plutus V3
     ↓
plutus.json
```

This part is complete enough to move into off-chain integration and further testing.

---

## 📋 44. What We Have NOT Done Yet

The smart contract is not yet connected to the real Zonke website payment flow.

The following work remains:

1. Confirm the arbiter credential.
2. Parameterise the validator correctly.
3. Derive the escrow script address.
4. Build the off-chain Cardano transaction code.
5. Connect the existing Zonke payment interface.
6. Connect Coxy Wallet using CIP-30.
7. Create a real Preprod funding transaction.
8. Lock test ADA into the escrow.
9. Test the escrow lifecycle on-chain.
10. Connect the backend.
11. Verify blockchain transactions through the backend.
12. Perform end-to-end testing.

---

## 45. The Existing Zonke Website

The Cardano integration should be added to the existing Zonke.me payment flow.

The project should not replace the current website with a separate blockchain application.

The intended integration is:

```text
Existing Zonke Hire Flow
          ↓
Existing Payment Interface
          ↓
Cardano Payment Option
          ↓
Coxy Wallet
          ↓
Cardano Preprod
          ↓
Zonke Escrow Contract
```

---

## 🖥️ 46. Frontend Responsibility

The frontend will eventually:

* Display the Cardano payment option.
* Request a wallet connection.
* Detect the available Cardano wallet.
* Request the user's wallet address where appropriate.
* Build or request the required transaction information.
* Ask the wallet to sign.
* Submit the transaction or pass it to the appropriate backend flow.
* Display the real transaction status.

The frontend must not contain private keys or seed phrases.

---

## ⚙️ 47. Backend Responsibility

The backend is being developed separately.

When available, the backend should become responsible for authoritative payment information.

Examples include:

* Job ID
* Client
* Developer
* Payment amount
* Payment reference
* Escrow status
* Transaction ID
* Blockchain verification
* Payment records

The frontend should not be treated as proof that payment occurred.

A button click is not a blockchain payment.

A real Cardano transaction must be verified.

---

## 48. Payment Reference

The escrow datum contains:

```text
payment_ref
```

This is intended to connect the Cardano escrow to the Zonke payment intent.

The general relationship will be:

```text
Zonke Job
     ↓
Payment Intent
     ↓
payment_ref
     ↓
Cardano Escrow
     ↓
Cardano Transaction
```

This allows the backend to associate an on-chain transaction with the correct Zonke payment.

The datum documentation describes the payment reference as a 32-byte hash.

The current validator does not yet enforce the byte length directly.

This should be reviewed before production deployment.

---

## 49. What Is a Script Address?

A smart contract is associated with a Cardano script address.

The escrow ADA will eventually be sent to that script address.

The simplified process is:

```text
Client Wallet
     ↓
Cardano Transaction
     ↓
Zonke Escrow Script Address
     ↓
Escrow UTxO
     ↓
Smart Contract controls spending
```

The exact address depends on the compiled validator, its parameterisation and the network.

For development, the address will be generated for Cardano Preprod.

---

## 50. What Is an Off-Chain Transaction?

The smart contract contains the on-chain rules.

Something still needs to create Cardano transactions that use those rules.

That software is called the off-chain part.

The off-chain application will construct transactions such as:

```text
Fund Escrow
Accept
Deliver
Approve
Claim
Refund
Dispute
Resolve
TimeoutFallback
```

The transaction is then signed by the appropriate wallet or authority.

---

## 51. Intended Wallet Flow

The eventual wallet process should be:

```text
Zonke.me
   ↓
User selects Cardano payment
   ↓
Website detects CIP-30 wallet
   ↓
User connects Coxy Wallet
   ↓
Website prepares transaction
   ↓
Coxy Wallet displays transaction
   ↓
User approves
   ↓
Wallet signs transaction
   ↓
Transaction submitted to Cardano Preprod
   ↓
Real transaction ID returned
```

The transaction ID can then be used by the backend for verification.

---

## 52. Why We Do Not Use Fake Wallet Integration

A fake button such as:

```text
Connect Coxy Wallet
```

is not enough.

The project needs an actual wallet connection.

The exact Coxy Wallet integration must be confirmed from the wallet's available CIP-30 interface.

The integration should discover the wallet rather than assuming an unverified browser object name.

---

## 🔒 53. Security Rules for the Integration

The frontend must never store:

* Seed phrases
* Private keys
* Wallet signing keys

The frontend should also not be treated as authoritative for:

* Payment amount
* Developer payout address
* Job identity
* Payment reference
* Escrow state

These values should eventually be controlled or verified by the backend and smart contract.

---

## 54. End-to-End Goal

The completed system should eventually work like this:

```text
                    ZONKE.ME
                       │
                       ▼
                 Client hires
                       │
                       ▼
              Existing payment UI
                       │
                       ▼
              Backend payment intent
                       │
                       ▼
                Cardano transaction
                       │
                       ▼
                 Coxy Wallet
                       │
                       ▼
                Client signs
                       │
                       ▼
               Cardano Preprod
                       │
                       ▼
             ZONKE ESCROW CONTRACT
                       │
                       ▼
                  ADA locked
                       │
                       ▼
             Developer does work
                       │
                       ▼
                Work delivered
                       │
                       ▼
             Client approves
                       │
                       ▼
             Smart contract checks
                       │
                       ▼
               Developer receives ADA
                       │
                       ▼
              Backend verifies payment
```

---

## 🚀 55. Development Milestones

### Phase 1 — Design

[✓] Define escrow purpose

[✓] Define escrow states

[✓] Define datum

[✓] Define redeemers

[✓] Define signer rules

[✓] Define deadline rules

[✓] Define dispute rules

[✓] Define arbiter model

---

### Phase 2 — Aiken Environment

[✓] Install Aikup

[✓] Install Aiken

[✓] Select Aiken v1.1.23

[✓] Configure Standard Library v3.0.0

[✓] Install VS Code Aiken extension

[✓] Fix Aiken PATH issue

[✓] Confirm Aiken version

---

### Phase 3 — Smart Contract

[✓] Create Aiken project

[✓] Create `aiken.toml`

[✓] Create `types.ak`

[✓] Create `util.ak`

[✓] Create `logic.ak`

[✓] Create `logic_tests.ak`

[✓] Create `validators/zonke_escrow.ak`

---

### Phase 4 — Testing

[✓] Run `aiken check`

[✓] Correct Aiken syntax issues

[✓] Correct Aiken version compatibility issue

[✓] Run complete test suite

[✓] 96/96 tests passed

[✓] 0 errors

[✓] 0 warnings

---

### Phase 5 — Compilation

[✓] Run `aiken build`

[✓] Compile Plutus V3 validator

[✓] Generate `plutus.json`

[✓] Obtain validator hash

---

### Phase 6 — Off-Chain Integration

[ ] Confirm arbiter credential

[ ] Parameterise validator

[ ] Generate Preprod script address

[ ] Create transaction-building code

[ ] Integrate existing Zonke payment UI

[ ] Connect CIP-30 wallet

[ ] Confirm Coxy Wallet integration

[ ] Fund escrow with test ADA

[ ] Test real Preprod transaction

---

### Phase 7 — Escrow Testing on Cardano

[ ] Test Funded state

[ ] Test Accept

[ ] Test Deliver

[ ] Test Approve

[ ] Test Claim

[ ] Test Cancel

[ ] Test Refund

[ ] Test Dispute

[ ] Test Resolve

[ ] Test TimeoutFallback

[ ] Test invalid transactions

[ ] Test transaction verification

---

### Phase 8 — Backend Integration

[ ] Connect payment intents

[ ] Connect payment reference

[ ] Connect job IDs

[ ] Store transaction IDs

[ ] Verify blockchain transactions

[ ] Update payment status

[ ] Connect escrow status to Zonke job status

---

### Phase 9 — End-to-End Testing

[ ] Client creates a job

[ ] Client hires developer

[ ] Payment intent is created

[ ] Client opens Cardano payment

[ ] Coxy Wallet connects

[ ] Client approves transaction

[ ] ADA reaches escrow

[ ] Backend verifies transaction

[ ] Developer accepts

[ ] Developer delivers work

[ ] Client approves

[ ] Smart contract releases ADA

[ ] Backend verifies final transaction

---

## 56. Current Project Position

The project is currently between the smart-contract phase and the off-chain integration phase.

The completed portion is:

```text
SMART CONTRACT FOUNDATION

Aiken
  ↓
Escrow Types
  ↓
Escrow Logic
  ↓
Automated Tests
  ↓
96/96 Tests Passed
  ↓
Aiken Build
  ↓
Plutus V3
  ↓
plutus.json
```

The next major stage is:

```text
OFF-CHAIN INTEGRATION

Plutus Blueprint
      ↓
Parameterised Validator
      ↓
Preprod Script Address
      ↓
Cardano Transaction Code
      ↓
CIP-30
      ↓
Coxy Wallet
      ↓
Existing Zonke Payment Flow
```

---

## 57. Useful PowerShell Commands

These commands are useful for future reference.

### Check Aikup

```powershell
aikup --version
```

Expected:

```text
aikup 0.0.11
```

---

### Check Aiken

```powershell
aiken --version
```

Expected:

```text
aiken v1.1.23+8949565
```

---

### Find Aiken

```powershell
Get-Command aiken
```

Expected location:

```text
C:\Users\user\.aiken\bin\aiken.exe
```

---

### Check Aiken executable

```powershell
Test-Path "$HOME\.aiken\bin\aiken.exe"
```

Expected:

```text
True
```

---

### Temporarily add Aiken to PATH

```powershell
$env:Path += ";$HOME\.aiken\bin"
```

---

### Enter the project

```powershell
cd "C:\Users\user\Downloads\zonke_escrow\zonke_escrow"
```

---

### List project files

```powershell
Get-ChildItem
```

---

### Run tests

```powershell
aiken check
```

---

### Build the project

```powershell
aiken build
```

---

## 🧯 58. Important Troubleshooting Notes

### Problem: `aiken` is not recognised

Check:

```powershell
aiken --version
```

If it fails, check:

```powershell
Test-Path "$HOME\.aiken\bin\aiken.exe"
```

If it returns `True`, temporarily add:

```powershell
$env:Path += ";$HOME\.aiken\bin"
```

Then run:

```powershell
aiken --version
```

---

### Problem: VS Code says `spawn aiken ENOENT`

This means VS Code cannot find the Aiken executable.

First check:

```powershell
aiken --version
```

If necessary:

```powershell
$env:Path += ";$HOME\.aiken\bin"
```

Then restart or reload the VS Code environment if the language server still cannot find Aiken.

---

### Problem: `aiken check` says there is no project

Make sure PowerShell is inside the directory containing:

```text
aiken.toml
```

Use:

```powershell
Get-ChildItem
```

You should see:

```text
aiken.toml
lib
validators
```

Then run:

```powershell
aiken check
```

---

### Problem: Aiken source contains strange Markdown characters

Aiken files must contain actual Aiken code.

Do not paste Markdown formatting such as:

````text
```aiken
````

into the `.ak` file.

Only copy the actual code inside the code block.

Also watch for accidental characters such as:

```text
*
\
```

that may have been added by text formatting.

---

## 59. Files That Should Be Kept in the Repository

The project should keep the source files and project configuration under version control.

Important files include:

```text
aiken.toml
plutus.json
lib/escrow/types.ak
lib/escrow/util.ak
lib/escrow/logic.ak
lib/escrow/logic_tests.ak
validators/zonke_escrow.ak
```

Generated build folders can be treated according to the project's Git configuration and repository policy.

---

## 60. Version Information for Future Reference

The current tested environment is:

```text
Aiken:
v1.1.23+8949565

Aikup:
0.0.11

Plutus:
V3

Aiken Standard Library:
v3.0.0

Project:
zonke/escrow

Project Version:
0.1.0
```

The successful test/build state should be preserved as a known working baseline.

---

## 61. Current Baseline

The following is the current known-good baseline:

```text
Aiken v1.1.23
        +
Stdlib v3.0.0
        +
Plutus V3
        ↓
Zonke Escrow Project
        ↓
96/96 tests passed
        ↓
0 errors
0 warnings
        ↓
aiken build successful
        ↓
plutus.json generated
```

If future changes cause the project to fail, this baseline can be used for comparison.

---

## ⚠️ 62. Important Technical Items to Review Before Deployment

The current development version should not be treated as production-ready simply because the tests pass.

Before deployment, the following should be reviewed and tested:

1. Arbiter credential.
2. Parameterised script address.
3. Payment reference length enforcement.
4. Exact off-chain datum encoding.
5. Exact redeemer encoding.
6. Wallet signing flow.
7. Transaction fee handling.
8. Minimum ADA requirements.
9. Preprod transaction behaviour.
10. Backend verification.
11. Invalid transaction attempts.
12. Full dispute lifecycle.
13. Timeout lifecycle.
14. Security review.

Passing unit tests is an important milestone, but on-chain integration testing is still required.

---

## 63. Single-Goal Summary

The whole project can be understood as five major layers:

```text
1. ZONKE.ME
Existing hiring and payment interface
        ↓
2. WALLET
Coxy Wallet through CIP-30
        ↓
3. CARDANO
Real ADA transaction on Preprod
        ↓
4. SMART CONTRACT
Aiken / Plutus V3 escrow rules
        ↓
5. BACKEND
Payment verification and Zonke records
```

Our work so far has mainly completed **Layer 4**, while preparing the foundation needed for Layers 2 and 3.

The final objective remains:

> Integrate a real Cardano escrow payment system into the existing Zonke.me hiring and payment process, allowing ADA to be locked by a Plutus V3 smart contract and released according to predefined escrow rules.

---

## 📊 64. Final Development Status

#### SMART CONTRACT

**Status: COMPLETED FOR DEVELOPMENT BASELINE**

* Aiken installed
* Correct Aiken version selected
* Standard Library configured
* Escrow data structures created
* Escrow state machine created
* Validator created
* Tests created
* 96/96 tests passed
* Plutus V3 compiled
* Blueprint generated
* Validator hash obtained

#### CARDANO OFF-CHAIN INTEGRATION

**Status: NEXT STAGE**

* Transaction construction still required
* Script address still required
* Coxy Wallet integration still required
* CIP-30 integration still required
* Real Preprod transaction still required

#### ZONKE BACKEND

**Status: PENDING BACKEND TEAM**

* Payment intent integration
* Transaction verification
* Payment record storage
* Escrow/job status integration

#### FINAL SYSTEM

**Status: IN DEVELOPMENT**

The smart-contract foundation is ready for the next development stage, but the complete payment system is not yet finished.

---

## 65. One-Sentence Project Description

> Zonke.me Cardano Escrow is a Plutus V3 smart-contract-based payment system written in Aiken that is being developed to hold client ADA in escrow and release it to developers according to predefined hiring, delivery, approval, dispute and timeout rules, with the final system intended to integrate Coxy Wallet, Cardano Preprod, the existing Zonke.me payment interface and the Zonke backend.
