#!/bin/bash
# Cron job: checks YooKassa for refunds every minute
# Add to crontab: * * * * * /var/www/thqlabel-new-2026/scripts/check-refunds.sh
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/payments/check-refunds
