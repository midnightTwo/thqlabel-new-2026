import paramiko
import time
import sys

HOST = '185.174.138.241'
USER = 'root'
PASS = 'Bp49Dk8O9yYK'
PROJECT = '/var/www/thqlabel-new-2026'
LOG = '/tmp/deploy.log'

def run(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

def main():
    action = sys.argv[1] if len(sys.argv) > 1 else 'start'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=30)

    if action == 'start':
        # Launch build in background via nohup
        cmd = f'nohup bash -c "cd {PROJECT} && npm run build > {LOG} 2>&1 && pm2 restart thqlabel >> {LOG} 2>&1 && echo DEPLOY_DONE >> {LOG}" &'
        print(f"Launching build in background...")
        client.exec_command(cmd)
        time.sleep(2)
        print("Build started! Run: python deploy.py check")
    
    elif action == 'check':
        out = run(client, f'cat {LOG} 2>/dev/null | tail -30')
        print(out)
        if 'DEPLOY_DONE' in out:
            print("\n DEPLOY COMPLETE!")
            # Verify
            http = run(client, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000')
            print(f"HTTP: {http}")
        elif 'error' in out.lower() or 'failed' in out.lower():
            print("\n BUILD FAILED - check log")
        else:
            print("\n... still building, run again in 30s")

    client.close()

if __name__ == '__main__':
    main()
