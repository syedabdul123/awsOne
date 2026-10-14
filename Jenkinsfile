pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'AWS_REGION', defaultValue: 'us-east-1', description: 'AWS region containing the ECR repository')
        string(name: 'ECR_REPOSITORY', defaultValue: 'rahman-studio', description: 'Existing ECR repository name')
        string(name: 'EC2_HOST', defaultValue: '16.170.215.135', description: 'EC2 public DNS name or IP address')
        string(name: 'EC2_USER', defaultValue: 'ec2-user', description: 'SSH user on EC2')
    }

    environment {
        AWS_CREDENTIALS_ID = 'aws-credentials'
        EC2_SSH_CREDENTIALS_ID = 'ec2-ssh-key'
        CONTAINER_NAME = 'rahman-studio'
    }

    stages {
        stage('Validate configuration') {
            steps {
                script {
                    if (!params.EC2_HOST?.trim()) {
                        error('Set EC2_HOST when starting this build.')
                    }
                    if (!(params.AWS_REGION ==~ /^[a-z0-9-]+$/)) {
                        error('AWS_REGION may contain only lowercase letters, digits, and hyphens.')
                    }
                    if (!(params.ECR_REPOSITORY ==~ /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)) {
                        error('ECR_REPOSITORY is not a valid ECR repository name.')
                    }
                    if (!(params.EC2_HOST ==~ /^[A-Za-z0-9.-]+$/)) {
                        error('EC2_HOST may contain only letters, digits, dots, and hyphens.')
                    }
                    if (!(params.EC2_USER ==~ /^[A-Za-z0-9._-]+$/)) {
                        error('EC2_USER may contain only letters, digits, dots, underscores, and hyphens.')
                    }
                }
            }
        }

        stage('Build and push image') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
                    script {
                        env.IMAGE_TAG = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
                        env.ECR_REGISTRY = sh(
                            script: 'aws sts get-caller-identity --query Account --output text',
                            returnStdout: true
                        ).trim() + ".dkr.ecr.${params.AWS_REGION}.amazonaws.com"
                        env.IMAGE_URI = "${env.ECR_REGISTRY}/${params.ECR_REPOSITORY}:${env.IMAGE_TAG}"
                    }
                    sh '''
                        set -eu
                        aws ecr get-login-password --region "$AWS_REGION" |
                            docker login --username AWS --password-stdin "$ECR_REGISTRY"
                        docker build --tag "$IMAGE_URI" .
                        docker push "$IMAGE_URI"
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: [env.EC2_SSH_CREDENTIALS_ID]) {
                    sh '''
                        set -eu
                        ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$EC2_USER@$EC2_HOST" \
                            "AWS_REGION='$AWS_REGION' ECR_REGISTRY='$ECR_REGISTRY' IMAGE_URI='$IMAGE_URI' CONTAINER_NAME='$CONTAINER_NAME' sh -s" <<'REMOTE'
set -eu
aws ecr get-login-password --region "$AWS_REGION" |
    docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker pull "$IMAGE_URI"
if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    docker rm --force "$CONTAINER_NAME"
fi
docker run --detach --name "$CONTAINER_NAME" --restart unless-stopped --publish 80:80 "$IMAGE_URI"
REMOTE
                    '''
                }
            }
        }
    }
}
