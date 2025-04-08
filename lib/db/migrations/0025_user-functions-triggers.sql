-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION create_user_from_auth() 
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.automagikui_user (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER after_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_from_auth();

CREATE OR REPLACE FUNCTION email_domain_and_waitlist_check()
RETURNS trigger AS $$
BEGIN
    IF NEW.email NOT LIKE '%@namastex.ai' THEN
        IF NOT EXISTS (
            SELECT 1
            FROM public.automagikui_waitlist
            WHERE email = NEW.email AND is_approved = true
        ) THEN
          RAISE EXCEPTION 'Email must be namastex.ai';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER email_domain_and_waitlist_check_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION email_domain_and_waitlist_check();

CREATE OR REPLACE FUNCTION delete_user_from_automagikui()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
    DELETE FROM public.automagikui_user WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER delete_user_from_automagikui_trigger
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION delete_user_from_automagikui();
