import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('185.174.138.241', username='root', password='Bp49Dk8O9yYK')

# Update Shop ID
stdin, stdout, stderr = c.exec_command("sed -i 's/YOOKASSA_SHOP_ID=1284996/YOOKASSA_SHOP_ID=1282827/' /var/www/thqlabel-new-2026/.env.local")
stdout.read()

# Verify
stdin, stdout, stderr = c.exec_command("grep YOOKASSA /var/www/thqlabel-new-2026/.env.local")
print(stdout.read().decode())

# Restart
stdin, stdout, stderr = c.exec_command("cd /var/www/thqlabel-new-2026 && pm2 restart thqlabel")
print(stdout.read().decode())

c.close()
print("Done!")
