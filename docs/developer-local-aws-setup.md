# Developer setup for local AWS Rekognition credentials

This guide is for developers who need to run the registration flow locally.

It assumes:

- You already have an AWS IAM user for account `280686762883`.
- An AWS admin has already granted your IAM user permission to assume the local
  development role.
- You do not need to create AWS roles, policies, or trust policies.
- You already have, or can configure, one local AWS CLI profile that authenticates
  as your IAM user.

The app does not need AWS keys in `.env`. Your computer stores your personal IAM
user credentials in the AWS CLI profile, and the app uses that profile to assume
a temporary role for Rekognition.

## How it works

```text
Your PC
  -> AWS CLI profile for your IAM user
  -> your personal IAM user
  -> assume CuentaUnicaRegistryLocalDeveloperRole
  -> temporary AWS credentials
  -> local Next.js app
  -> AWS Rekognition
```

The role used by the app is:

```text
arn:aws:iam::280686762883:role/CuentaUnicaRegistryLocalDeveloperRole
```

## 1. Install AWS CLI

### Windows

Install AWS CLI v2 from the official installer:

```text
https://awscli.amazonaws.com/AWSCLIV2.msi
```

After installation, close and reopen PowerShell.

Verify the installation:

```powershell
aws --version
```

You should see something like:

```text
aws-cli/2.x.x Python/3.x.x Windows/...
```

### macOS

If you use Homebrew:

```sh
brew install awscli
aws --version
```

### Linux

Follow the AWS CLI v2 installation guide for your distribution, then verify:

```sh
aws --version
```

## 2. Confirm your IAM user profile

AWS CLI needs one local source profile that can authenticate as your own IAM
user. Some developers may already have this configured.

List your local AWS profiles:

```powershell
aws configure list-profiles
```

If you already see a personal profile for your IAM user, you can reuse it. In
that case, write down its profile name and continue to step 4.

You can also inspect the current default profile:

```powershell
aws sts get-caller-identity --profile default
```

If it returns your IAM user in account `280686762883`, you can use `default` as
the source profile.

If you do not have a working IAM user profile yet, configure one in the next
step.

## 3. Configure your personal AWS profile only if needed

Skip this step if step 2 already showed a working source profile.

If you need to create the source profile, open PowerShell and run:

```powershell
aws configure --profile cuenta-unica-user
```

AWS CLI will ask for four values:

```text
AWS Access Key ID [None]: <your IAM user access key id>
AWS Secret Access Key [None]: <your IAM user secret access key>
Default region name [None]: us-east-1
Default output format [None]: json
```

This creates or updates local files under:

```text
C:\Users\<your-user>\.aws\
```

Do not commit anything from `.aws` to the repository.

If you do not have an access key for your IAM user, ask the AWS administrator
whether your IAM user is allowed to create its own access key. If not, the admin
must create or rotate one for you through a secure channel.

## 4. Configure the app AWS profile

Now configure a second profile named `cuenta-unica-dev`. This profile does not
store another access key. It tells AWS CLI to use your personal profile to
assume the development role.

Open the AWS config file:

```powershell
notepad "$env:USERPROFILE\.aws\config"
```

Add this block:

```ini
[profile cuenta-unica-dev]
role_arn = arn:aws:iam::280686762883:role/CuentaUnicaRegistryLocalDeveloperRole
source_profile = cuenta-unica-user
region = us-east-1
```

If your working IAM user profile is named `default`, use this instead:

```ini
[profile cuenta-unica-dev]
role_arn = arn:aws:iam::280686762883:role/CuentaUnicaRegistryLocalDeveloperRole
source_profile = default
region = us-east-1
```

Save the file.

## 5. Verify that role assumption works

Run:

```powershell
aws sts get-caller-identity --profile cuenta-unica-dev
```

Expected result:

```json
{
  "UserId": "...",
  "Account": "280686762883",
  "Arn": "arn:aws:sts::280686762883:assumed-role/CuentaUnicaRegistryLocalDeveloperRole/..."
}
```

The important part is:

```text
assumed-role/CuentaUnicaRegistryLocalDeveloperRole
```

If you see your IAM user ARN instead of the assumed role ARN, the app profile is
not configured correctly.

## 6. Configure the project `.env`

Create `.env` from `.env.example` if you have not done it yet.

For AWS Rekognition, use:

```env
AWS_REGION=us-east-1
AWS_PROFILE=cuenta-unica-dev
```

For local development, leave these Cloud Run OIDC variables empty or unchanged
unless you are specifically testing Cloud Run behavior:

```env
AWS_ROLE_ARN=
AWS_WEB_IDENTITY_TOKEN_AUDIENCE=sts.amazonaws.com
AWS_ROLE_SESSION_NAME=cuenta-unica-registry
```

Do not add personal AWS access keys to `.env`.

## 7. Install project dependencies

From the repository root:

```powershell
bun install
```

## 8. Run the app

From the repository root:

```powershell
bun run dev
```

Open:

```text
http://localhost:3000/register
```

The first request that touches Rekognition can take a little longer because AWS
CLI resolves the profile and requests temporary credentials for the role. After
that, the AWS SDK reuses temporary credentials until they expire.

## 9. Quick local validation

Before testing the UI, you can verify that the app profile can reach AWS:

```powershell
aws rekognition list-collections --profile cuenta-unica-dev --region us-east-1
```

This command may return an empty list. That is fine. The useful part is that it
does not fail with an authentication or authorization error.

## Troubleshooting

### The profile was not found

Error example:

```text
The config profile (cuenta-unica-dev) could not be found
```

Fix:

1. Open the config file:

   ```powershell
   notepad "$env:USERPROFILE\.aws\config"
   ```

2. Confirm this block exists exactly:

   ```ini
   [profile cuenta-unica-dev]
   role_arn = arn:aws:iam::280686762883:role/CuentaUnicaRegistryLocalDeveloperRole
   source_profile = cuenta-unica-user
   region = us-east-1
   ```

### The source profile was not found

Error example:

```text
The source_profile "cuenta-unica-user" referenced in the profile does not exist
```

Fix:

```powershell
aws configure --profile cuenta-unica-user
```

Or edit `source_profile` in `C:\Users\<your-user>\.aws\config` so it matches a
profile that exists in:

```powershell
aws configure list-profiles
```

### Access denied when assuming the role

Error example:

```text
AccessDenied: User is not authorized to perform: sts:AssumeRole
```

Fix:

Ask the AWS administrator to confirm that your IAM user is allowed to assume:

```text
arn:aws:iam::280686762883:role/CuentaUnicaRegistryLocalDeveloperRole
```

This is an AWS permission issue, not a local app issue.

### The app still cannot reach Rekognition

Run:

```powershell
aws sts get-caller-identity --profile cuenta-unica-dev
```

If this command fails, fix the AWS profile first.

If this command works, confirm your `.env` has:

```env
AWS_REGION=us-east-1
AWS_PROFILE=cuenta-unica-dev
```

Then restart the dev server:

```powershell
bun run dev
```

## Security rules

- Do not share your IAM user credentials with another developer.
- Do not add AWS access keys to `.env`.
- Do not commit files from `C:\Users\<your-user>\.aws\`.
- Do not paste access keys, secret keys, or session tokens in Slack, tickets,
  GitHub comments, or documentation.
- If you think your access key was exposed, ask the AWS administrator to rotate
  it.
