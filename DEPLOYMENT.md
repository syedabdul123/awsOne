# Jenkins deployment to EC2

This pipeline builds the static site into the Nginx image in `Dockerfile`, pushes
it to Amazon ECR, and replaces the `rahman-studio` container on EC2.

## Prerequisites

- Create an ECR repository (default name: `rahman-studio`) in the AWS region
  used by the pipeline.
- Configure a Linux Jenkins agent with Git, Docker CLI/daemon access, AWS CLI,
  and OpenSSH client.
- Install the Jenkins **Pipeline**, **Credentials Binding**, **AWS Credentials**,
  and **SSH Agent** plugins.
- Add Jenkins credentials:
  - `aws-credentials`: AWS access key credentials allowed to call
    `sts:GetCallerIdentity`, `ecr:GetAuthorizationToken`, and push images to the
    selected ECR repository.
  - `ec2-ssh-key`: SSH private key for the EC2 deployment user.
- Give the EC2 instance an IAM role with ECR pull permissions, install Docker
  and AWS CLI, and allow the deployment user to run Docker commands.
- Allow inbound TCP port 22 from the Jenkins agent and TCP port 80 from the
  intended web clients in the EC2 security group.
- Add the EC2 SSH host key to the Jenkins agent's `known_hosts`; deployment
  intentionally requires strict host key checking.

## Run the pipeline

Add this repository to Jenkins as a Pipeline or Multibranch Pipeline project so
Jenkins loads the root `Jenkinsfile`. Start a build and set `AWS_REGION`,
`ECR_REPOSITORY`, `EC2_HOST`, and `EC2_USER` as needed. The default EC2 user is
`ec2-user`; the image is tagged with the checked-out Git commit.

The deploy step pulls the image using the EC2 instance role, removes the prior
container, and starts the new version on host port 80. Ensure port 80 is
available on the instance.
