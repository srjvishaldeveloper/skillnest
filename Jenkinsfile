// =============================================================================
// SkillNest LMS — Lightweight Jenkins Pipeline (SkillNest-only deploy)
// =============================================================================
pipeline {
    agent any

    environment {
        VPS_HOST = "${params.VPS_HOST ?: 'your-vps-ip'}"
        VPS_USER = "${params.VPS_USER ?: 'deploy'}"
        VPS_DIR  = "${params.VPS_DIR ?: '/home/deploy/jobnest'}"
    }

    parameters {
        string(name: 'VPS_HOST', defaultValue: 'your-vps-ip', description: 'VPS IP address')
        string(name: 'VPS_USER', defaultValue: 'deploy', description: 'SSH user')
        string(name: 'VPS_DIR', defaultValue: '/home/deploy/jobnest', description: 'Deploy directory')
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Build') {
            steps {
                dir('Skillnest') {
                    sh 'docker compose build skillnest'
                }
            }
        }
        stage('Deploy') {
            steps {
                sshagent(credentials: ['vps-deploy-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'EOF'
                            cd ${VPS_DIR}
                            git pull origin main
                            docker compose run --rm skillnest npx prisma migrate deploy
                            docker compose up -d --build skillnest
                        EOF
                    """
                }
            }
        }
    }
    post {
        always { cleanWs() }
    }
}
