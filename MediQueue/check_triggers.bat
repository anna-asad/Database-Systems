@echo off
echo ========================================
echo CHECKING LIVE DATABASE TRIGGERS
echo ========================================
echo.

sqlcmd -S localhost -d MediQueue -U mediqueue_user -P MediQueue123! -Q "SELECT OBJECT_NAME(t.parent_id) AS [Table], t.name AS [Trigger], CASE WHEN t.is_disabled = 0 THEN 'ENABLED' ELSE 'DISABLED' END AS [Status] FROM sys.triggers t WHERE t.parent_class = 1 ORDER BY [Table], [Trigger];"

echo.
echo ========================================
echo Check complete!
echo ========================================
pause
