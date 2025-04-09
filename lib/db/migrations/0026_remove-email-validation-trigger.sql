-- Custom SQL migration file, put your code below! --
DROP TRIGGER IF EXISTS email_domain_and_waitlist_check_trigger ON auth.users;
DROP FUNCTION IF EXISTS email_domain_and_waitlist_check();
