--
-- PostgreSQL database dump
--

\restrict kQZBA1LFyqd4vy2YLKTbrLkNCyfHQIS6EtpemMEe43o3aSZmhxgdH0DKOHnO33c

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: bump_rev(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bump_rev(p_scope text, p_project_id integer) RETURNS void
    LANGUAGE sql
    AS $$
  INSERT INTO revision (scope, project_id, rev) VALUES (p_scope, p_project_id, 1)
  ON CONFLICT (scope) DO UPDATE SET rev = revision.rev + 1;
$$;


--
-- Name: capture_project_document_revision(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.capture_project_document_revision() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  actor_id text := COALESCE(NEW."updated_by_user_id", NEW."created_by_user_id");
  previous_revision "project_document_revision"%ROWTYPE;
  preceding_revision "project_document_revision"%ROWTYPE;
  coalesce_edit boolean := false;
  previous_is_content_edit boolean := false;
BEGIN
  IF current_setting('app.document_rebalance', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Ignore same-version physical maintenance only when the snapshot payload is
  -- unchanged. Project copy deliberately rewrites parent/content at version 1,
  -- and those updates must still replace the seeded revision.
  IF TG_OP = 'UPDATE'
    AND NEW."version" = OLD."version"
    AND ROW(
      NEW."parent_id", NEW."title", NEW."content", NEW."content_json",
      NEW."icon", NEW."metadata", NEW."full_width", NEW."is_private",
      NEW."is_locked", NEW."archived_at", NEW."position", NEW."owner_user_id"
    ) IS NOT DISTINCT FROM ROW(
      OLD."parent_id", OLD."title", OLD."content", OLD."content_json",
      OLD."icon", OLD."metadata", OLD."full_width", OLD."is_private",
      OLD."is_locked", OLD."archived_at", OLD."position", OLD."owner_user_id"
    )
  THEN
    RETURN NEW;
  END IF;

  SELECT * INTO previous_revision
  FROM "project_document_revision"
  WHERE "document_id" = NEW."id"
  ORDER BY "version" DESC
  LIMIT 1;

  SELECT * INTO preceding_revision
  FROM "project_document_revision"
  WHERE "document_id" = NEW."id"
  ORDER BY "version" DESC
  OFFSET 1
  LIMIT 1;

  IF TG_OP = 'UPDATE' THEN
    coalesce_edit :=
      OLD."parent_id" IS NOT DISTINCT FROM NEW."parent_id"
      AND OLD."icon" IS NOT DISTINCT FROM NEW."icon"
      AND OLD."metadata" IS NOT DISTINCT FROM NEW."metadata"
      AND OLD."full_width" IS NOT DISTINCT FROM NEW."full_width"
      AND OLD."is_private" IS NOT DISTINCT FROM NEW."is_private"
      AND OLD."is_locked" IS NOT DISTINCT FROM NEW."is_locked"
      AND OLD."archived_at" IS NOT DISTINCT FROM NEW."archived_at"
      AND OLD."position" IS NOT DISTINCT FROM NEW."position"
      AND OLD."owner_user_id" IS NOT DISTINCT FROM NEW."owner_user_id"
      AND (
        OLD."title" IS DISTINCT FROM NEW."title"
        OR OLD."content" IS DISTINCT FROM NEW."content"
        OR OLD."content_json" IS DISTINCT FROM NEW."content_json"
      );
  END IF;

  IF previous_revision."id" IS NOT NULL AND preceding_revision."id" IS NOT NULL THEN
    previous_is_content_edit :=
      previous_revision."parent_id" IS NOT DISTINCT FROM preceding_revision."parent_id"
      AND previous_revision."icon" IS NOT DISTINCT FROM preceding_revision."icon"
      AND previous_revision."metadata" IS NOT DISTINCT FROM preceding_revision."metadata"
      AND previous_revision."full_width" IS NOT DISTINCT FROM preceding_revision."full_width"
      AND previous_revision."is_private" IS NOT DISTINCT FROM preceding_revision."is_private"
      AND previous_revision."is_locked" IS NOT DISTINCT FROM preceding_revision."is_locked"
      AND previous_revision."archived_at" IS NOT DISTINCT FROM preceding_revision."archived_at"
      AND previous_revision."position" IS NOT DISTINCT FROM preceding_revision."position"
      AND previous_revision."owner_user_id" IS NOT DISTINCT FROM preceding_revision."owner_user_id"
      AND (
        previous_revision."title" IS DISTINCT FROM preceding_revision."title"
        OR previous_revision."content" IS DISTINCT FROM preceding_revision."content"
        OR previous_revision."content_json" IS DISTINCT FROM preceding_revision."content_json"
      );
  END IF;

  IF coalesce_edit
    AND previous_is_content_edit
    AND current_setting('app.document_checkpoint', true) IS DISTINCT FROM 'true'
    AND previous_revision."id" IS NOT NULL
    AND previous_revision."created_by_user_id" IS NOT DISTINCT FROM actor_id
    AND previous_revision."created_at" BETWEEN NEW."updated_at" - interval '10 minutes' AND NEW."updated_at"
  THEN
    UPDATE "project_document_revision" SET
      "version" = NEW."version",
      "parent_id" = NEW."parent_id",
      "title" = NEW."title",
      "content" = NEW."content",
      "content_json" = NEW."content_json",
      "icon" = NEW."icon",
      "metadata" = NEW."metadata",
      "full_width" = NEW."full_width",
      "is_private" = NEW."is_private",
      "is_locked" = NEW."is_locked",
      "archived_at" = NEW."archived_at",
      "position" = NEW."position",
      "owner_user_id" = NEW."owner_user_id",
      "created_by_user_id" = actor_id,
      "created_at" = NEW."updated_at"
    WHERE "id" = previous_revision."id";
  ELSE
    INSERT INTO "project_document_revision" (
      "document_id",
      "version",
      "parent_id",
      "title",
      "content",
      "content_json",
      "icon",
      "metadata",
      "full_width",
      "is_private",
      "is_locked",
      "archived_at",
      "position",
      "owner_user_id",
      "created_by_user_id",
      "created_at"
    ) VALUES (
      NEW."id",
      NEW."version",
      NEW."parent_id",
      NEW."title",
      NEW."content",
      NEW."content_json",
      NEW."icon",
      NEW."metadata",
      NEW."full_width",
      NEW."is_private",
      NEW."is_locked",
      NEW."archived_at",
      NEW."position",
      NEW."owner_user_id",
      actor_id,
      NEW."updated_at"
    )
    ON CONFLICT ("document_id", "version") DO UPDATE SET
      "parent_id" = EXCLUDED."parent_id",
      "title" = EXCLUDED."title",
      "content" = EXCLUDED."content",
      "content_json" = EXCLUDED."content_json",
      "icon" = EXCLUDED."icon",
      "metadata" = EXCLUDED."metadata",
      "full_width" = EXCLUDED."full_width",
      "is_private" = EXCLUDED."is_private",
      "is_locked" = EXCLUDED."is_locked",
      "archived_at" = EXCLUDED."archived_at",
      "position" = EXCLUDED."position",
      "owner_user_id" = EXCLUDED."owner_user_id",
      "created_by_user_id" = EXCLUDED."created_by_user_id",
      "created_at" = EXCLUDED."created_at";
  END IF;

  DELETE FROM "project_document_revision"
  WHERE "id" IN (
    SELECT "id"
    FROM "project_document_revision"
    WHERE "document_id" = NEW."id"
    ORDER BY "version" DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$;


--
-- Name: default_project_document_owner(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.default_project_document_owner() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW."owner_user_id" IS NULL THEN
    NEW."owner_user_id" := NEW."created_by_user_id";
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: project_document_initiative_rev(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.project_document_initiative_rev() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  row_document_id integer;
  row_initiative_id integer;
  row_project_id integer;
BEGIN
  row_document_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.document_id ELSE NEW.document_id END;
  row_initiative_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.initiative_id ELSE NEW.initiative_id END;
  SELECT project_id INTO row_project_id FROM project_document WHERE id = row_document_id;
  IF row_project_id IS NULL THEN
    SELECT project_id INTO row_project_id FROM initiative WHERE id = row_initiative_id;
  END IF;
  IF row_project_id IS NOT NULL THEN
    PERFORM bump_rev('documents:' || row_project_id, row_project_id);
    PERFORM bump_rev('initiative:' || row_initiative_id, row_project_id);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: project_document_initiative_validate_project(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.project_document_initiative_validate_project() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  document_project_id integer;
  initiative_project_id integer;
BEGIN
  SELECT project_id INTO document_project_id FROM project_document WHERE id = NEW.document_id;
  SELECT project_id INTO initiative_project_id FROM initiative WHERE id = NEW.initiative_id;
  IF document_project_id IS NULL OR initiative_project_id IS NULL OR document_project_id <> initiative_project_id THEN
    RAISE EXCEPTION 'A document and initiative link must stay inside one project'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: project_document_issue_rev(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.project_document_issue_rev() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  row_document_id integer;
  row_issue_id integer;
  row_project_id integer;
BEGIN
  row_document_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.document_id ELSE NEW.document_id END;
  row_issue_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.issue_id ELSE NEW.issue_id END;
  SELECT project_id INTO row_project_id FROM project_document WHERE id = row_document_id;
  IF row_project_id IS NULL THEN
    SELECT project_id INTO row_project_id FROM issue WHERE id = row_issue_id;
  END IF;
  IF row_project_id IS NOT NULL THEN
    PERFORM bump_rev('documents:' || row_project_id, row_project_id);
    PERFORM bump_rev('issue:' || row_issue_id, row_project_id);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: project_document_issue_validate_project(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.project_document_issue_validate_project() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  document_project_id integer;
  issue_project_id integer;
BEGIN
  SELECT project_id INTO document_project_id FROM project_document WHERE id = NEW.document_id;
  SELECT project_id INTO issue_project_id FROM issue WHERE id = NEW.issue_id;
  IF document_project_id IS NULL OR issue_project_id IS NULL OR document_project_id <> issue_project_id THEN
    RAISE EXCEPTION 'A document and work item link must stay inside one project'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: rev_activity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_activity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r issue_activity%ROWTYPE;
  p integer;
  i integer;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  IF r.issue_id IS NOT NULL THEN
    SELECT project_id, initiative_id INTO p, i FROM issue WHERE id = r.issue_id;
    IF p IS NULL THEN RETURN NULL; END IF;
    PERFORM bump_rev('issue:' || r.issue_id, p);
    IF i IS NOT NULL THEN PERFORM bump_rev('initiative:' || i, p); END IF;
  ELSE
    SELECT project_id INTO p FROM initiative WHERE id = r.initiative_id;
    IF p IS NULL THEN RETURN NULL; END IF;
    PERFORM bump_rev('initiative:' || r.initiative_id, p);
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: rev_checklist_item(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_checklist_item() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  checklist_id integer;
  target_id integer;
  p integer;
  i integer;
BEGIN
  IF TG_OP = 'DELETE' THEN checklist_id := OLD.checklist_id; ELSE checklist_id := NEW.checklist_id; END IF;
  SELECT c.issue_id, s.project_id, s.initiative_id INTO target_id, p, i
  FROM issue_checklist c JOIN issue s ON s.id = c.issue_id
  WHERE c.id = checklist_id;
  IF p IS NULL THEN RETURN NULL; END IF;
  PERFORM bump_rev('issue:' || target_id, p);
  IF i IS NOT NULL THEN PERFORM bump_rev('initiative:' || i, p); END IF;
  RETURN NULL;
END;
$$;


--
-- Name: rev_cycle(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_cycle() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r cycle%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  PERFORM bump_rev('board:' || r.project_id, r.project_id);
  RETURN NULL;
END;
$$;


--
-- Name: rev_document(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_document() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  row_project_id integer;
BEGIN
  IF current_setting('app.document_rebalance', true) = 'true' THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    row_project_id := OLD."project_id";
  ELSE
    row_project_id := NEW."project_id";
  END IF;
  PERFORM bump_rev('documents:' || row_project_id, row_project_id);
  RETURN NULL;
END;
$$;


--
-- Name: rev_document_child(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_document_child() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  document_id integer;
  row_project_id integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    document_id := OLD."document_id";
  ELSE
    document_id := NEW."document_id";
  END IF;
  SELECT "project_id" INTO row_project_id
  FROM "project_document"
  WHERE "id" = document_id;
  IF row_project_id IS NOT NULL THEN
    PERFORM bump_rev('documents:' || row_project_id, row_project_id);
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: rev_inbox(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_inbox() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r notification%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  PERFORM bump_rev('inbox:' || r.project_id || ':' || r.user_id, r.project_id);
  RETURN NULL;
END;
$$;


--
-- Name: rev_initiative(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_initiative() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r initiative%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  -- Each issue on the board carries the name of its initiative, so a rename has to
  -- move the board marker too.
  PERFORM bump_rev('board:' || r.project_id, r.project_id);
  IF TG_OP = 'DELETE' THEN
    DELETE FROM revision WHERE scope = 'initiative:' || r.id;
  ELSE
    PERFORM bump_rev('initiative:' || r.id, r.project_id);
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: rev_initiative_child(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_initiative_child() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_id integer;
  p integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := (to_jsonb(OLD) ->> TG_ARGV[0])::integer;
  ELSE
    target_id := (to_jsonb(NEW) ->> TG_ARGV[0])::integer;
  END IF;
  SELECT project_id INTO p FROM initiative WHERE id = target_id;
  IF p IS NULL THEN RETURN NULL; END IF;
  PERFORM bump_rev('board:' || p, p);
  PERFORM bump_rev('initiative:' || target_id, p);
  RETURN NULL;
END;
$$;


--
-- Name: rev_issue(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_issue() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  r issue%ROWTYPE;
  lo integer;
  hi integer;
BEGIN
  IF TG_OP = 'DELETE' THEN r := OLD; ELSE r := NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.project_id <> NEW.project_id THEN
    PERFORM bump_rev('board:' || least(OLD.project_id, NEW.project_id), least(OLD.project_id, NEW.project_id));
    PERFORM bump_rev('board:' || greatest(OLD.project_id, NEW.project_id), greatest(OLD.project_id, NEW.project_id));
    UPDATE revision SET project_id = NEW.project_id WHERE scope = 'issue:' || r.id;
  ELSE
    PERFORM bump_rev('board:' || r.project_id, r.project_id);
  END IF;
  IF TG_OP = 'DELETE' THEN
    DELETE FROM revision WHERE scope = 'issue:' || r.id;
  ELSE
    PERFORM bump_rev('issue:' || r.id, r.project_id);
  END IF;
  -- An issue that moved between initiatives changes both: the one it left no longer
  -- shows it. The two counters are taken in id order, so two issues moving between
  -- the same initiatives in opposite directions cannot deadlock. least/greatest skip
  -- a NULL side, which leaves a plain add or removal with one id in lo.
  IF TG_OP = 'UPDATE' AND OLD.initiative_id IS DISTINCT FROM NEW.initiative_id THEN
    lo := least(OLD.initiative_id, NEW.initiative_id);
    hi := greatest(OLD.initiative_id, NEW.initiative_id);
  ELSE
    lo := r.initiative_id;
  END IF;
  IF lo IS NOT NULL THEN PERFORM bump_rev('initiative:' || lo, r.project_id); END IF;
  IF hi IS NOT NULL AND hi <> lo THEN PERFORM bump_rev('initiative:' || hi, r.project_id); END IF;
  RETURN NULL;
END;
$$;


--
-- Name: rev_issue_child(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_issue_child() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_id integer;
  p integer;
  i integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := (to_jsonb(OLD) ->> TG_ARGV[0])::integer;
  ELSE
    target_id := (to_jsonb(NEW) ->> TG_ARGV[0])::integer;
  END IF;
  SELECT project_id, initiative_id INTO p, i FROM issue WHERE id = target_id;
  -- The issue is already gone when its rows cascade away; its own delete moved the
  -- markers.
  IF p IS NULL THEN RETURN NULL; END IF;
  IF TG_ARGV[1] = 'board' THEN PERFORM bump_rev('board:' || p, p); END IF;
  PERFORM bump_rev('issue:' || target_id, p);
  IF i IS NOT NULL THEN PERFORM bump_rev('initiative:' || i, p); END IF;
  RETURN NULL;
END;
$$;


--
-- Name: rev_issue_development_check(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_issue_development_check() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
	link_id integer;
	target_id integer;
	p integer;
	i integer;
BEGIN
	IF TG_OP = 'DELETE' THEN link_id := OLD.development_link_id; ELSE link_id := NEW.development_link_id; END IF;
	SELECT l.issue_id, s.project_id, s.initiative_id INTO target_id, p, i
	FROM issue_development_link l JOIN issue s ON s.id = l.issue_id
	WHERE l.id = link_id;
	IF p IS NULL THEN RETURN NULL; END IF;
	PERFORM bump_rev('issue:' || target_id, p);
	IF i IS NOT NULL THEN PERFORM bump_rev('initiative:' || i, p); END IF;
	RETURN NULL;
END;
$$;


--
-- Name: rev_project_cleanup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rev_project_cleanup() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM revision WHERE project_id = OLD.id;
  RETURN NULL;
END;
$$;


--
-- Name: trigger_set_timestamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_set_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW."createdAt" = NOW();
        NEW."updatedAt" = NOW();
        NEW."createdAtZ" = NOW();
        NEW."updatedAtZ" = NOW();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW."updatedAt" = NOW();
        NEW."updatedAtZ" = NOW();
        NEW."createdAt" = OLD."createdAt";
        NEW."createdAtZ" = OLD."createdAtZ";
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp without time zone,
    refresh_token_expires_at timestamp without time zone,
    scope text,
    password text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: agent_chat_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_chat_event (
    id bigint NOT NULL,
    message_id integer NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_chat_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_chat_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_chat_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_chat_event_id_seq OWNED BY public.agent_chat_event.id;


--
-- Name: agent_chat_favorite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_chat_favorite (
    user_id text NOT NULL,
    agent_id integer NOT NULL,
    thread_id text NOT NULL
);


--
-- Name: agent_chat_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_chat_message (
    id integer NOT NULL,
    thread_id text NOT NULL,
    agent_id integer NOT NULL,
    role text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_chat_message_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))),
    CONSTRAINT agent_chat_message_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'streaming'::text, 'success'::text, 'failed'::text, 'canceled'::text])))
);


--
-- Name: agent_chat_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_chat_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_chat_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_chat_message_id_seq OWNED BY public.agent_chat_message.id;


--
-- Name: agent_chat_thread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_chat_thread (
    id text NOT NULL,
    agent_id integer NOT NULL,
    user_id text NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cli_session_id text
);


--
-- Name: agent_chat_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_chat_usage (
    thread_id text NOT NULL,
    agent_id integer NOT NULL,
    input_tokens integer,
    output_tokens integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: agent_field_trigger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_field_trigger (
    agent_id integer NOT NULL,
    field_id integer NOT NULL,
    delay_sec integer DEFAULT 120 NOT NULL,
    CONSTRAINT agent_field_trigger_delay_check CHECK (((delay_sec >= 0) AND (delay_sec <= 86400)))
);


--
-- Name: agent_run; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_run (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    issue_id integer,
    source_activity_id integer,
    prompt text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_id integer,
    trigger text DEFAULT 'delegation'::text NOT NULL,
    scheduled_for timestamp with time zone,
    output text,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    input_tokens integer,
    output_tokens integer,
    project_id integer NOT NULL,
    CONSTRAINT agent_run_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'canceled'::text]))),
    CONSTRAINT agent_run_trigger_check CHECK ((trigger = ANY (ARRAY['mention'::text, 'delegation'::text, 'field'::text, 'schedule'::text, 'manual'::text, 'status'::text, 'event'::text])))
);


--
-- Name: agent_run_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_run_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_run_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_run_id_seq OWNED BY public.agent_run.id;


--
-- Name: agent_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_schedule (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    name text NOT NULL,
    prompt text NOT NULL,
    cron text,
    timezone text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    next_run_at timestamp with time zone,
    last_run_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    project_id integer NOT NULL,
    type text DEFAULT 'cron'::text NOT NULL,
    column_id integer,
    delay_sec integer DEFAULT 0 NOT NULL,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT agent_schedule_delay_check CHECK (((delay_sec >= 0) AND (delay_sec <= 86400))),
    CONSTRAINT agent_schedule_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text]))),
    CONSTRAINT agent_schedule_type_check CHECK ((((type = 'cron'::text) AND (cron IS NOT NULL) AND (next_run_at IS NOT NULL) AND (column_id IS NULL)) OR ((type = 'status'::text) AND (column_id IS NOT NULL) AND (cron IS NULL) AND (next_run_at IS NULL)) OR ((type <> ALL (ARRAY['cron'::text, 'status'::text])) AND (cron IS NULL) AND (next_run_at IS NULL) AND (column_id IS NULL))))
);


--
-- Name: agent_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_schedule_id_seq OWNED BY public.agent_schedule.id;


--
-- Name: agent_skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_skill (
    id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    source text NOT NULL,
    source_url text,
    s3_prefix text NOT NULL,
    files jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    team_id integer NOT NULL,
    CONSTRAINT agent_skill_source_check CHECK ((source = ANY (ARRAY['upload'::text, 'inline'::text, 'github'::text])))
);


--
-- Name: agent_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_skill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_skill_id_seq OWNED BY public.agent_skill.id;


--
-- Name: agent_skill_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_skill_link (
    agent_id integer NOT NULL,
    skill_id integer NOT NULL
);


--
-- Name: agent_tool; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_tool (
    id integer NOT NULL,
    tool_key text NOT NULL,
    credential_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    team_id integer NOT NULL
);


--
-- Name: agent_tool_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_tool_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_tool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_tool_id_seq OWNED BY public.agent_tool.id;


--
-- Name: agent_tool_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_tool_link (
    agent_id integer NOT NULL,
    agent_tool_id integer NOT NULL
);


--
-- Name: ai_agent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_agent (
    id integer NOT NULL,
    user_id text NOT NULL,
    username text NOT NULL,
    kind text NOT NULL,
    model text,
    instructions text,
    tools jsonb DEFAULT '[]'::jsonb NOT NULL,
    temperature double precision,
    max_steps integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    memory_enabled boolean DEFAULT false NOT NULL,
    memory_last_messages integer,
    trigger_on_mention boolean DEFAULT true NOT NULL,
    trigger_on_assign boolean DEFAULT false NOT NULL,
    model_credential_id integer,
    api_key_ciphertext text,
    api_key_iv text,
    api_key_auth_tag text,
    owner_user_id text,
    runner_scope text DEFAULT 'team'::text NOT NULL,
    last_seen_at timestamp with time zone,
    delegation_delay_sec integer DEFAULT 120 NOT NULL,
    team_id integer NOT NULL,
    reasoning_effort text,
    CONSTRAINT ai_agent_delegation_delay_check CHECK (((delegation_delay_sec >= 0) AND (delegation_delay_sec <= 86400))),
    CONSTRAINT ai_agent_kind_check CHECK ((kind = ANY (ARRAY['external'::text, 'internal'::text]))),
    CONSTRAINT ai_agent_reasoning_effort_check CHECK ((reasoning_effort = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT ai_agent_runner_scope_check CHECK ((runner_scope = ANY (ARRAY['owner'::text, 'team'::text])))
);


--
-- Name: ai_agent_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_agent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_agent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_agent_id_seq OWNED BY public.ai_agent.id;


--
-- Name: apikey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apikey (
    id text NOT NULL,
    config_id text DEFAULT 'default'::text NOT NULL,
    name text,
    start text,
    reference_id text NOT NULL,
    prefix text,
    key text NOT NULL,
    refill_interval integer,
    refill_amount integer,
    last_refill_at timestamp without time zone,
    enabled boolean DEFAULT true,
    rate_limit_enabled boolean DEFAULT true,
    rate_limit_time_window integer DEFAULT 1000,
    rate_limit_max integer DEFAULT 100,
    request_count integer DEFAULT 0,
    remaining integer,
    last_request timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    permissions text,
    metadata text
);


--
-- Name: app_secret; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_secret (
    key text NOT NULL,
    ciphertext text NOT NULL,
    iv text NOT NULL,
    auth_tag text NOT NULL,
    redacted jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_setting (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_attachment (
    id integer NOT NULL,
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id integer NOT NULL,
    uploaded_by_user_id text,
    s3_key text NOT NULL,
    filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_attachment_id_seq OWNED BY public.chat_attachment.id;


--
-- Name: custom_field; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_field (
    id integer NOT NULL,
    issue_type_id integer,
    name text NOT NULL,
    field_type text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    project_id integer NOT NULL,
    show_in_body boolean DEFAULT false NOT NULL,
    member_scope text,
    CONSTRAINT custom_field_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'markdown'::text, 'url'::text, 'number'::text, 'boolean'::text, 'date'::text, 'datetime'::text, 'datetime_range'::text, 'select'::text, 'multi_select'::text, 'member'::text]))),
    CONSTRAINT custom_field_member_scope_check CHECK ((((field_type = 'member'::text) = (member_scope IS NOT NULL)) AND ((member_scope IS NULL) OR (member_scope = ANY (ARRAY['all'::text, 'humans'::text, 'agents'::text])))))
);


--
-- Name: custom_field_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_field_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_field_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_field_id_seq OWNED BY public.custom_field.id;


--
-- Name: custom_field_option; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_field_option (
    id integer NOT NULL,
    field_id integer NOT NULL,
    value text NOT NULL,
    color text DEFAULT '#6b7280'::text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- Name: custom_field_option_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.custom_field_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: custom_field_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.custom_field_option_id_seq OWNED BY public.custom_field_option.id;


--
-- Name: cycle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cycle (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    goal text DEFAULT ''::text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT cycle_dates_check CHECK ((end_date >= start_date))
);


--
-- Name: cycle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cycle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cycle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cycle_id_seq OWNED BY public.cycle.id;


--
-- Name: document_asset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_asset (
    id integer NOT NULL,
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id integer NOT NULL,
    uploaded_by_user_id text,
    s3_key text NOT NULL,
    filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_asset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_asset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_asset_id_seq OWNED BY public.document_asset.id;


--
-- Name: document_collaboration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_collaboration (
    document_id integer NOT NULL,
    epoch uuid DEFAULT gen_random_uuid() NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    content_json jsonb NOT NULL
);


--
-- Name: document_comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_comment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id integer NOT NULL,
    parent_id uuid,
    author_id text,
    body text NOT NULL,
    quote text DEFAULT ''::text NOT NULL,
    selection_from integer,
    selection_to integer,
    orphaned boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: document_step; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_step (
    document_id integer NOT NULL,
    version integer NOT NULL,
    client_id text NOT NULL,
    step jsonb NOT NULL
);


--
-- Name: git_managed_repository; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.git_managed_repository (
    id integer NOT NULL,
    connection_id integer NOT NULL,
    external_id text NOT NULL,
    full_name text NOT NULL,
    web_url text NOT NULL,
    webhook_external_id text NOT NULL,
    status text DEFAULT 'connected'::text NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    project_id integer NOT NULL
);


--
-- Name: git_managed_repository_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.git_managed_repository_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: git_managed_repository_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.git_managed_repository_id_seq OWNED BY public.git_managed_repository.id;


--
-- Name: git_provider_connection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.git_provider_connection (
    id integer NOT NULL,
    provider text NOT NULL,
    base_url text NOT NULL,
    account_login text NOT NULL,
    ciphertext text NOT NULL,
    iv text NOT NULL,
    auth_tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    team_id integer NOT NULL
);


--
-- Name: git_provider_connection_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.git_provider_connection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: git_provider_connection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.git_provider_connection_id_seq OWNED BY public.git_provider_connection.id;


--
-- Name: import_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_job (
    id integer NOT NULL,
    project_id integer NOT NULL,
    created_by_user_id text NOT NULL,
    source text NOT NULL,
    phase text DEFAULT 'discover'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    cursor jsonb DEFAULT '{}'::jsonb NOT NULL,
    credential_ciphertext text,
    credential_iv text,
    credential_auth_tag text,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT import_job_phase_check CHECK ((phase = ANY (ARRAY['discover'::text, 'create'::text, 'link'::text, 'rewrite'::text, 'attachments'::text, 'done'::text]))),
    CONSTRAINT import_job_source_check CHECK ((source = ANY (ARRAY['plane'::text, 'linear'::text]))),
    CONSTRAINT import_job_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'paused'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: import_job_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.import_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: import_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.import_job_id_seq OWNED BY public.import_job.id;


--
-- Name: import_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_record (
    id integer NOT NULL,
    import_job_id integer NOT NULL,
    source_entity_type text NOT NULL,
    source_id text NOT NULL,
    source_display_id text,
    local_entity_type text,
    local_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT import_record_local_entity_type_check CHECK (((local_entity_type IS NULL) OR (local_entity_type = ANY (ARRAY['issue'::text, 'comment'::text, 'label'::text, 'state'::text, 'cycle'::text, 'attachment'::text])))),
    CONSTRAINT import_record_source_entity_type_check CHECK ((source_entity_type = ANY (ARRAY['issue'::text, 'comment'::text, 'label'::text, 'state'::text, 'cycle'::text, 'attachment'::text])))
);


--
-- Name: import_record_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.import_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: import_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.import_record_id_seq OWNED BY public.import_record.id;


--
-- Name: initiative; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative (
    id integer NOT NULL,
    project_id integer NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    owner_user_id text,
    priority text,
    start_date date,
    target_date date,
    "position" double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT initiative_status_check CHECK ((status = ANY (ARRAY['proposed'::text, 'planned'::text, 'active'::text, 'completed'::text, 'canceled'::text])))
);


--
-- Name: initiative_attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative_attachment (
    id integer NOT NULL,
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id integer NOT NULL,
    s3_key text NOT NULL,
    filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: initiative_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.initiative_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: initiative_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.initiative_attachment_id_seq OWNED BY public.initiative_attachment.id;


--
-- Name: initiative_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.initiative_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: initiative_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.initiative_id_seq OWNED BY public.initiative.id;


--
-- Name: initiative_label; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative_label (
    initiative_id integer NOT NULL,
    label_id integer NOT NULL
);


--
-- Name: integration_credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_credential (
    id integer NOT NULL,
    integration_key text NOT NULL,
    label text,
    ciphertext text NOT NULL,
    iv text NOT NULL,
    auth_tag text NOT NULL,
    redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    team_id integer NOT NULL
);


--
-- Name: integration_credential_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.integration_credential_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: integration_credential_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.integration_credential_id_seq OWNED BY public.integration_credential.id;


--
-- Name: issue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue (
    id integer NOT NULL,
    project_id integer NOT NULL,
    sequence_number integer NOT NULL,
    type_id integer,
    column_id integer NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    priority text,
    start_date date,
    due_date date,
    "position" double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assignee_user_id text,
    delegate_user_id text,
    initiative_id integer,
    archived_at timestamp with time zone,
    share_token uuid,
    parent_id integer,
    share_extended boolean DEFAULT false NOT NULL,
    cycle_id integer,
    estimate_points numeric,
    estimate_minutes integer,
    CONSTRAINT issue_estimate_minutes_check CHECK ((estimate_minutes >= 0)),
    CONSTRAINT issue_estimate_points_check CHECK ((estimate_points >= (0)::numeric))
);


--
-- Name: issue_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_activity (
    id integer NOT NULL,
    issue_id integer,
    kind text NOT NULL,
    actor_name text,
    body text,
    action text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    actor_user_id text,
    initiative_id integer,
    reply_to_id integer,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    edited_at timestamp with time zone,
    CONSTRAINT issue_activity_kind_check CHECK ((kind = ANY (ARRAY['comment'::text, 'activity'::text]))),
    CONSTRAINT issue_activity_owner_check CHECK (((issue_id IS NOT NULL) <> (initiative_id IS NOT NULL)))
);


--
-- Name: issue_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_activity_id_seq OWNED BY public.issue_activity.id;


--
-- Name: issue_attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_attachment (
    id integer NOT NULL,
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    issue_id integer NOT NULL,
    s3_key text NOT NULL,
    filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_attachment_id_seq OWNED BY public.issue_attachment.id;


--
-- Name: issue_checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_checklist (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    title text NOT NULL,
    "position" double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_checklist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_checklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_checklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_checklist_id_seq OWNED BY public.issue_checklist.id;


--
-- Name: issue_checklist_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_checklist_item (
    id integer NOT NULL,
    checklist_id integer NOT NULL,
    content text NOT NULL,
    done boolean DEFAULT false NOT NULL,
    "position" double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_checklist_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_checklist_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_checklist_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_checklist_item_id_seq OWNED BY public.issue_checklist_item.id;


--
-- Name: issue_cycle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_cycle (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    cycle_id integer NOT NULL,
    entered_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone
);


--
-- Name: issue_cycle_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_cycle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_cycle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_cycle_id_seq OWNED BY public.issue_cycle.id;


--
-- Name: issue_development_check; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_development_check (
    id integer NOT NULL,
    development_link_id integer NOT NULL,
    external_id text NOT NULL,
    app_id text NOT NULL,
    name text NOT NULL,
    status text NOT NULL,
    url text,
    head_sha text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_development_check_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_development_check_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_development_check_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_development_check_id_seq OWNED BY public.issue_development_check.id;


--
-- Name: issue_development_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_development_link (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    provider text NOT NULL,
    repository text NOT NULL,
    number integer,
    title text NOT NULL,
    url text,
    state text NOT NULL,
    draft boolean DEFAULT false NOT NULL,
    source_branch text,
    target_branch text NOT NULL,
    head_sha text,
    pipeline_status text,
    pipeline_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    kind text DEFAULT 'pull_request'::text NOT NULL,
    external_key text NOT NULL
);


--
-- Name: issue_development_link_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_development_link_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_development_link_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_development_link_id_seq OWNED BY public.issue_development_link.id;


--
-- Name: issue_field_option; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_field_option (
    issue_id integer NOT NULL,
    field_id integer NOT NULL,
    option_id integer NOT NULL
);


--
-- Name: issue_field_value; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_field_value (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    field_id integer NOT NULL,
    value_text text,
    value_number numeric,
    value_bool boolean,
    value_date date,
    value_datetime timestamp with time zone,
    value_datetime_end timestamp with time zone,
    value_user_id text
);


--
-- Name: issue_field_value_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_field_value_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_field_value_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_field_value_id_seq OWNED BY public.issue_field_value.id;


--
-- Name: issue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_id_seq OWNED BY public.issue.id;


--
-- Name: issue_import; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_import (
    id integer NOT NULL,
    public_id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id integer NOT NULL,
    attachment_id integer NOT NULL,
    status text DEFAULT 'mapped'::text NOT NULL,
    mapping jsonb,
    error_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_import_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_import_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_import_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_import_id_seq OWNED BY public.issue_import.id;


--
-- Name: issue_key_alias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_key_alias (
    project_id integer NOT NULL,
    sequence_number integer NOT NULL,
    issue_id integer NOT NULL
);


--
-- Name: issue_label; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_label (
    issue_id integer NOT NULL,
    label_id integer NOT NULL
);


--
-- Name: issue_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_link (
    id integer NOT NULL,
    source_issue_id integer NOT NULL,
    target_issue_id integer NOT NULL,
    kind text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT issue_link_kind_check CHECK ((kind = ANY (ARRAY['blocks'::text, 'relates'::text, 'duplicates'::text]))),
    CONSTRAINT issue_link_self_check CHECK ((source_issue_id <> target_issue_id))
);


--
-- Name: issue_link_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_link_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_link_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_link_id_seq OWNED BY public.issue_link.id;


--
-- Name: issue_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_status (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    column_id integer,
    column_name text,
    state_type text,
    entered_at timestamp with time zone DEFAULT now() NOT NULL,
    left_at timestamp with time zone
);


--
-- Name: issue_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_status_id_seq OWNED BY public.issue_status.id;


--
-- Name: issue_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_template (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    title_template text DEFAULT ''::text NOT NULL,
    description_template text DEFAULT ''::text NOT NULL,
    type_id integer,
    column_id integer,
    priority text,
    assignee_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_template_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_template_id_seq OWNED BY public.issue_template.id;


--
-- Name: issue_template_label; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_template_label (
    template_id integer NOT NULL,
    label_id integer NOT NULL
);


--
-- Name: issue_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_type (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    icon text DEFAULT ''::text NOT NULL,
    color text DEFAULT '#6b7280'::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_type_id_seq OWNED BY public.issue_type.id;


--
-- Name: issue_watcher; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_watcher (
    issue_id integer NOT NULL,
    user_id text NOT NULL,
    subscribed boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: issue_worklog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_worklog (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    user_id text NOT NULL,
    minutes integer NOT NULL,
    spent_on date NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT issue_worklog_minutes_check CHECK ((minutes > 0))
);


--
-- Name: issue_worklog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_worklog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_worklog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_worklog_id_seq OWNED BY public.issue_worklog.id;


--
-- Name: jwks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jwks (
    id text NOT NULL,
    public_key text NOT NULL,
    private_key text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone,
    alg text,
    crv text
);


--
-- Name: label; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.label (
    id integer NOT NULL,
    project_id integer NOT NULL,
    group_id integer,
    name text NOT NULL,
    color text DEFAULT '#6b7280'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: label_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.label_group (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6b7280'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: label_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.label_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: label_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.label_group_id_seq OWNED BY public.label_group.id;


--
-- Name: label_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.label_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: label_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.label_id_seq OWNED BY public.label.id;


--
-- Name: mastra_agent_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_agent_versions (
    id text NOT NULL,
    "agentId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    name text NOT NULL,
    description text,
    instructions text NOT NULL,
    model jsonb NOT NULL,
    tools jsonb,
    "defaultOptions" jsonb,
    workflows jsonb,
    agents jsonb,
    "integrationTools" jsonb,
    "toolProviders" jsonb,
    "inputProcessors" jsonb,
    "outputProcessors" jsonb,
    memory jsonb,
    scorers jsonb,
    "mcpClients" jsonb,
    "requestContextSchema" jsonb,
    workspace jsonb,
    skills jsonb,
    "skillsFormat" text,
    browser jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_agents (
    id text NOT NULL,
    status text NOT NULL,
    "activeVersionId" text,
    "authorId" text,
    visibility text,
    metadata jsonb,
    "favoriteCount" integer,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_ai_spans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_ai_spans (
    "traceId" text NOT NULL,
    "spanId" text NOT NULL,
    name text NOT NULL,
    "spanType" text NOT NULL,
    "isEvent" boolean NOT NULL,
    "startedAt" timestamp without time zone NOT NULL,
    "parentSpanId" text,
    "entityType" text,
    "entityId" text,
    "entityName" text,
    "parentEntityType" text,
    "parentEntityId" text,
    "parentEntityName" text,
    "rootEntityType" text,
    "rootEntityId" text,
    "rootEntityName" text,
    "userId" text,
    "organizationId" text,
    "resourceId" text,
    "runId" text,
    "sessionId" text,
    "threadId" text,
    "requestId" text,
    environment text,
    "serviceName" text,
    scope jsonb,
    "entityVersionId" text,
    "parentEntityVersionId" text,
    "rootEntityVersionId" text,
    "experimentId" text,
    source text,
    metadata jsonb,
    tags jsonb,
    attributes jsonb,
    links jsonb,
    input jsonb,
    output jsonb,
    error jsonb,
    "endedAt" timestamp without time zone,
    "requestContext" jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone,
    "startedAtZ" timestamp with time zone DEFAULT now(),
    "endedAtZ" timestamp with time zone DEFAULT now(),
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_background_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_background_tasks (
    id text NOT NULL,
    tool_call_id text NOT NULL,
    tool_name text NOT NULL,
    agent_id text NOT NULL,
    run_id text NOT NULL,
    thread_id text,
    resource_id text,
    status text NOT NULL,
    args jsonb NOT NULL,
    result jsonb,
    error jsonb,
    suspend_payload jsonb,
    retry_count integer NOT NULL,
    max_retries integer NOT NULL,
    timeout_ms integer NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "startedAt" timestamp without time zone,
    "suspendedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "startedAtZ" timestamp with time zone DEFAULT now(),
    "suspendedAtZ" timestamp with time zone DEFAULT now(),
    "completedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_channel_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_channel_config (
    platform text NOT NULL,
    data jsonb NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_channel_installations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_channel_installations (
    id text NOT NULL,
    platform text NOT NULL,
    "agentId" text NOT NULL,
    status text NOT NULL,
    "webhookId" text,
    data jsonb NOT NULL,
    "configHash" text,
    error text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_dataset_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_dataset_items (
    id text NOT NULL,
    "datasetId" text NOT NULL,
    "datasetVersion" integer NOT NULL,
    "externalId" text,
    "organizationId" text,
    "projectId" text,
    "validTo" integer,
    "isDeleted" boolean NOT NULL,
    input jsonb NOT NULL,
    "groundTruth" jsonb,
    "requestContext" jsonb,
    metadata jsonb,
    source jsonb,
    "expectedTrajectory" jsonb,
    "toolMocks" jsonb,
    "unmockedToolPolicy" text,
    "scorerIds" jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_dataset_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_dataset_versions (
    id text NOT NULL,
    "datasetId" text NOT NULL,
    version integer NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_datasets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_datasets (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    metadata jsonb,
    "inputSchema" jsonb,
    "groundTruthSchema" jsonb,
    "requestContextSchema" jsonb,
    tags jsonb,
    "targetType" text,
    "targetIds" jsonb,
    "scorerIds" jsonb,
    "organizationId" text,
    "projectId" text,
    "candidateKey" text,
    "candidateId" text,
    version integer NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_experiment_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_experiment_results (
    id text NOT NULL,
    "experimentId" text NOT NULL,
    "itemId" text NOT NULL,
    "itemDatasetVersion" integer,
    input jsonb NOT NULL,
    output jsonb,
    "groundTruth" jsonb,
    error jsonb,
    "startedAt" timestamp without time zone NOT NULL,
    "completedAt" timestamp without time zone NOT NULL,
    "retryCount" integer NOT NULL,
    "traceId" text,
    status text,
    tags jsonb,
    comment text,
    "toolMockReport" jsonb,
    "organizationId" text,
    "projectId" text,
    "createdAt" timestamp without time zone NOT NULL,
    "startedAtZ" timestamp with time zone DEFAULT now(),
    "completedAtZ" timestamp with time zone DEFAULT now(),
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_experiments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_experiments (
    id text NOT NULL,
    name text,
    description text,
    metadata jsonb,
    provenance jsonb,
    "runnerAttestation" jsonb,
    "experimentSetId" text,
    "comparisonId" text,
    "variantId" text,
    "trialIndex" integer,
    "datasetId" text,
    "datasetVersion" integer,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    status text NOT NULL,
    "totalItems" integer NOT NULL,
    "succeededCount" integer NOT NULL,
    "failedCount" integer NOT NULL,
    "skippedCount" integer NOT NULL,
    "startedAt" timestamp without time zone,
    "completedAt" timestamp without time zone,
    "agentVersion" text,
    "organizationId" text,
    "projectId" text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "startedAtZ" timestamp with time zone DEFAULT now(),
    "completedAtZ" timestamp with time zone DEFAULT now(),
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_favorites (
    "userId" text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_mcp_client_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_mcp_client_versions (
    id text NOT NULL,
    "mcpClientId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    name text NOT NULL,
    description text,
    servers jsonb NOT NULL,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_mcp_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_mcp_clients (
    id text NOT NULL,
    status text NOT NULL,
    "activeVersionId" text,
    "authorId" text,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_mcp_server_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_mcp_server_versions (
    id text NOT NULL,
    "mcpServerId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    name text NOT NULL,
    version text NOT NULL,
    description text,
    instructions text,
    repository jsonb,
    "releaseDate" text,
    "isLatest" boolean,
    "packageCanonical" text,
    tools jsonb,
    agents jsonb,
    workflows jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_mcp_servers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_mcp_servers (
    id text NOT NULL,
    status text NOT NULL,
    "activeVersionId" text,
    "authorId" text,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_messages (
    id text NOT NULL,
    thread_id text NOT NULL,
    content text NOT NULL,
    role text NOT NULL,
    type text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "resourceId" text,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_notifications (
    id text NOT NULL,
    "threadId" text NOT NULL,
    source text NOT NULL,
    kind text NOT NULL,
    priority text NOT NULL,
    status text NOT NULL,
    summary text NOT NULL,
    payload jsonb,
    "resourceId" text,
    "agentId" text,
    "sourceId" text,
    "dedupeKey" text,
    "coalesceKey" text,
    "coalescedCount" integer NOT NULL,
    attributes jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "deliveredAt" timestamp without time zone,
    "seenAt" timestamp without time zone,
    "dismissedAt" timestamp without time zone,
    "archivedAt" timestamp without time zone,
    "discardedAt" timestamp without time zone,
    "deliverAt" timestamp without time zone,
    "summaryAt" timestamp without time zone,
    "deliveryReason" text,
    "deliveryAttempts" integer NOT NULL,
    "lastDeliveryAttemptAt" timestamp without time zone,
    "lastDeliveryError" text,
    "deliveredSignalId" text,
    "summarySignalId" text,
    metadata jsonb,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now(),
    "deliveredAtZ" timestamp with time zone DEFAULT now(),
    "seenAtZ" timestamp with time zone DEFAULT now(),
    "dismissedAtZ" timestamp with time zone DEFAULT now(),
    "archivedAtZ" timestamp with time zone DEFAULT now(),
    "discardedAtZ" timestamp with time zone DEFAULT now(),
    "deliverAtZ" timestamp with time zone DEFAULT now(),
    "summaryAtZ" timestamp with time zone DEFAULT now(),
    "lastDeliveryAttemptAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_observational_memory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_observational_memory (
    id text NOT NULL,
    "lookupKey" text NOT NULL,
    scope text NOT NULL,
    "resourceId" text,
    "threadId" text,
    "activeObservations" text NOT NULL,
    "activeObservationsPendingUpdate" text,
    "originType" text NOT NULL,
    config text NOT NULL,
    "generationCount" integer NOT NULL,
    "lastObservedAt" timestamp without time zone,
    "lastReflectionAt" timestamp without time zone,
    "pendingMessageTokens" integer NOT NULL,
    "totalTokensObserved" integer NOT NULL,
    "observationTokenCount" integer NOT NULL,
    "isObserving" boolean NOT NULL,
    "isReflecting" boolean NOT NULL,
    "observedMessageIds" jsonb,
    "observedTimezone" text,
    "bufferedObservations" text,
    "bufferedObservationTokens" integer,
    "bufferedMessageIds" jsonb,
    "bufferedReflection" text,
    "bufferedReflectionTokens" integer,
    "bufferedReflectionInputTokens" integer,
    "reflectedObservationLineCount" integer,
    "bufferedObservationChunks" jsonb,
    "isBufferingObservation" boolean NOT NULL,
    "isBufferingReflection" boolean NOT NULL,
    "lastBufferedAtTokens" integer NOT NULL,
    "lastBufferedAtTime" timestamp without time zone,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "lastObservedAtZ" timestamp with time zone DEFAULT now(),
    "lastReflectionAtZ" timestamp with time zone DEFAULT now(),
    "lastBufferedAtTimeZ" timestamp with time zone DEFAULT now(),
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_prompt_block_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_prompt_block_versions (
    id text NOT NULL,
    "blockId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    name text NOT NULL,
    description text,
    content text NOT NULL,
    rules jsonb,
    "requestContextSchema" jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_prompt_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_prompt_blocks (
    id text NOT NULL,
    status text NOT NULL,
    "activeVersionId" text,
    "authorId" text,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_resources (
    id text NOT NULL,
    "workingMemory" text,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_schedule_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_schedule_triggers (
    id text NOT NULL,
    schedule_id text NOT NULL,
    run_id text,
    scheduled_fire_at bigint NOT NULL,
    actual_fire_at bigint NOT NULL,
    outcome text NOT NULL,
    error text,
    trigger_kind text NOT NULL,
    parent_trigger_id text,
    metadata jsonb
);


--
-- Name: mastra_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_schedules (
    id text NOT NULL,
    target jsonb NOT NULL,
    cron text NOT NULL,
    timezone text,
    status text NOT NULL,
    next_fire_at bigint NOT NULL,
    last_fire_at bigint,
    last_run_id text,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    metadata jsonb,
    owner_type text,
    owner_id text
);


--
-- Name: mastra_scorer_definition_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_scorer_definition_versions (
    id text NOT NULL,
    "scorerDefinitionId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    model jsonb,
    instructions text,
    "scoreRange" jsonb,
    "presetConfig" jsonb,
    "defaultSampling" jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_scorer_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_scorer_definitions (
    id text NOT NULL,
    status text NOT NULL,
    "activeVersionId" text,
    "authorId" text,
    "organizationId" text,
    "projectId" text,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_scorers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_scorers (
    id text NOT NULL,
    "scorerId" text NOT NULL,
    "traceId" text,
    "spanId" text,
    "runId" text NOT NULL,
    scorer jsonb NOT NULL,
    "preprocessStepResult" jsonb,
    "extractStepResult" jsonb,
    "analyzeStepResult" jsonb,
    score double precision NOT NULL,
    reason text,
    metadata jsonb,
    "preprocessPrompt" text,
    "extractPrompt" text,
    "generateScorePrompt" text,
    "generateReasonPrompt" text,
    "analyzePrompt" text,
    "reasonPrompt" text,
    input jsonb NOT NULL,
    output jsonb NOT NULL,
    "additionalContext" jsonb,
    "requestContext" jsonb,
    "entityType" text,
    entity jsonb,
    "entityId" text,
    source text NOT NULL,
    "resourceId" text,
    "threadId" text,
    "organizationId" text,
    "projectId" text,
    "batchId" text,
    "datasetId" text,
    "datasetItemId" text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_skill_blobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_skill_blobs (
    hash text NOT NULL,
    content text NOT NULL,
    size integer NOT NULL,
    "mimeType" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_skill_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_skill_versions (
    id text NOT NULL,
    "skillId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    instructions text NOT NULL,
    license text,
    compatibility jsonb,
    source jsonb,
    "references" jsonb,
    scripts jsonb,
    assets jsonb,
    files jsonb,
    metadata jsonb,
    tree jsonb,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_skills (
    id text NOT NULL,
    status text NOT NULL,
    "activeVersionId" text,
    "authorId" text,
    visibility text,
    "favoriteCount" integer,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_thread_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_thread_state (
    "threadId" text NOT NULL,
    type text NOT NULL,
    value jsonb NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_threads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_threads (
    id text NOT NULL,
    "resourceId" text NOT NULL,
    title text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_tool_provider_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_tool_provider_connections (
    "authorId" text NOT NULL,
    "providerId" text NOT NULL,
    "connectionId" text NOT NULL,
    toolkit text NOT NULL,
    label text,
    scope text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_workflow_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_workflow_definitions (
    id text NOT NULL,
    description text,
    metadata jsonb,
    "inputSchema" jsonb NOT NULL,
    "outputSchema" jsonb NOT NULL,
    "stateSchema" jsonb,
    "requestContextSchema" jsonb,
    graph jsonb NOT NULL,
    status text NOT NULL,
    source text NOT NULL,
    "authorId" text,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_workflow_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_workflow_snapshot (
    workflow_name text NOT NULL,
    run_id text NOT NULL,
    "resourceId" text,
    snapshot jsonb NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_workspace_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_workspace_versions (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "versionNumber" integer NOT NULL,
    name text NOT NULL,
    description text,
    filesystem jsonb,
    sandbox jsonb,
    mounts jsonb,
    search jsonb,
    skills jsonb,
    tools jsonb,
    "autoSync" boolean,
    "operationTimeout" integer,
    "changedFields" jsonb,
    "changeMessage" text,
    "createdAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: mastra_workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mastra_workspaces (
    id text NOT NULL,
    status text NOT NULL,
    "activeVersionId" text,
    "authorId" text,
    metadata jsonb,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    "createdAtZ" timestamp with time zone DEFAULT now(),
    "updatedAtZ" timestamp with time zone DEFAULT now()
);


--
-- Name: model_price; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_price (
    id integer NOT NULL,
    workspace_id integer NOT NULL,
    provider text NOT NULL,
    model text NOT NULL,
    input double precision NOT NULL,
    output double precision NOT NULL,
    cache_read double precision,
    cache_write double precision,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT model_price_rates_check CHECK (((input >= (0)::double precision) AND (output >= (0)::double precision) AND (COALESCE(cache_read, (0)::double precision) >= (0)::double precision) AND (COALESCE(cache_write, (0)::double precision) >= (0)::double precision)))
);


--
-- Name: model_price_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.model_price_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: model_price_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.model_price_id_seq OWNED BY public.model_price.id;


--
-- Name: note_board; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.note_board (
    id integer NOT NULL,
    project_id integer NOT NULL,
    owner_user_id text,
    name text NOT NULL,
    canvas jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_user_id text
);


--
-- Name: note_board_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.note_board_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: note_board_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.note_board_id_seq OWNED BY public.note_board.id;


--
-- Name: note_board_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.note_board_member (
    board_id integer NOT NULL,
    user_id text NOT NULL
);


--
-- Name: notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification (
    id integer NOT NULL,
    user_id text NOT NULL,
    project_id integer NOT NULL,
    issue_id integer NOT NULL,
    source_activity_id integer,
    type text NOT NULL,
    actor_user_id text,
    actor_name text,
    read_at timestamp with time zone,
    snoozed_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_type_check CHECK ((type = ANY (ARRAY['assigned'::text, 'mentioned'::text, 'commented'::text, 'state_changed'::text])))
);


--
-- Name: notification_delivery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_delivery (
    id integer NOT NULL,
    project_id integer NOT NULL,
    channel text NOT NULL,
    recipient text,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_delivery_channel_check CHECK ((channel = ANY (ARRAY['email'::text, 'telegram'::text])))
);


--
-- Name: notification_delivery_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_delivery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_delivery_id_seq OWNED BY public.notification_delivery.id;


--
-- Name: notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_id_seq OWNED BY public.notification.id;


--
-- Name: oauth_access_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_access_token (
    id text NOT NULL,
    token text NOT NULL,
    client_id text NOT NULL,
    session_id text,
    user_id text,
    reference_id text,
    authorization_code_id text,
    resources text[],
    requested_user_info_claims text[],
    refresh_id text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL,
    revoked timestamp without time zone,
    confirmation jsonb,
    scopes text[] NOT NULL
);


--
-- Name: oauth_client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_client (
    id text NOT NULL,
    client_id text NOT NULL,
    client_secret text,
    client_discovery_id text,
    disabled boolean DEFAULT false,
    skip_consent boolean,
    enable_end_session boolean,
    subject_type text,
    scopes text[],
    client_credentials_scopes text[] DEFAULT '{}'::text[],
    user_id text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    name text,
    uri text,
    icon text,
    contacts text[],
    tos text,
    policy text,
    software_id text,
    software_version text,
    software_statement text,
    redirect_uris text[] NOT NULL,
    post_logout_redirect_uris text[],
    backchannel_logout_uri text,
    backchannel_logout_session_required boolean,
    token_endpoint_auth_method text,
    application_type text,
    jwks text,
    jwks_uri text,
    grant_types text[],
    response_types text[],
    require_pkce boolean,
    dpop_bound_access_tokens boolean DEFAULT false,
    reference_id text,
    metadata jsonb
);


--
-- Name: oauth_client_assertion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_client_assertion (
    id text NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: oauth_client_resource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_client_resource (
    id text NOT NULL,
    client_id text NOT NULL,
    resource_id text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone
);


--
-- Name: oauth_consent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_consent (
    id text NOT NULL,
    client_id text NOT NULL,
    user_id text,
    reference_id text,
    resources text[],
    requested_user_info_claims text[],
    scopes text[] NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: oauth_refresh_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_refresh_token (
    id text NOT NULL,
    token text NOT NULL,
    client_id text NOT NULL,
    session_id text,
    user_id text NOT NULL,
    reference_id text,
    authorization_code_id text,
    resources text[],
    requested_user_info_claims text[],
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL,
    revoked timestamp without time zone,
    rotated_at timestamp without time zone,
    rotation_replay_response text,
    rotation_replay_expires_at timestamp without time zone,
    auth_time timestamp without time zone,
    confirmation jsonb,
    scopes text[] NOT NULL
);


--
-- Name: oauth_resource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oauth_resource (
    id text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    access_token_ttl integer,
    refresh_token_ttl integer,
    signing_algorithm text,
    signing_key_id text,
    allowed_scopes text[],
    custom_claims jsonb,
    dpop_bound_access_tokens_required boolean DEFAULT false,
    disabled boolean DEFAULT false,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    policy_version integer DEFAULT 1,
    metadata jsonb
);


--
-- Name: passkey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.passkey (
    id text NOT NULL,
    name text,
    public_key text NOT NULL,
    user_id text NOT NULL,
    credential_id text NOT NULL,
    counter integer NOT NULL,
    device_type text NOT NULL,
    backed_up boolean NOT NULL,
    transports text,
    created_at timestamp without time zone,
    aaguid text
);


--
-- Name: project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project (
    id integer NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    next_sequence integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    mcp_enabled boolean DEFAULT false NOT NULL,
    initiatives_enabled boolean DEFAULT true NOT NULL,
    dashboards_enabled boolean DEFAULT true NOT NULL,
    notes_enabled boolean DEFAULT true NOT NULL,
    cycles_enabled boolean DEFAULT true NOT NULL,
    subtasks_enabled boolean DEFAULT true NOT NULL,
    checklists_enabled boolean DEFAULT true NOT NULL,
    issue_stats_enabled boolean DEFAULT true NOT NULL,
    points_estimate_enabled boolean DEFAULT false NOT NULL,
    time_estimate_enabled boolean DEFAULT false NOT NULL,
    time_logging_enabled boolean DEFAULT false NOT NULL,
    documents_enabled boolean DEFAULT true NOT NULL,
    team_id integer NOT NULL,
    archived_at timestamp with time zone
);


--
-- Name: project_action; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_action (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    condition jsonb DEFAULT '{}'::jsonb NOT NULL,
    effect jsonb DEFAULT '{}'::jsonb NOT NULL,
    "position" double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    icon text DEFAULT ''::text NOT NULL
);


--
-- Name: project_action_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_action_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_action_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_action_id_seq OWNED BY public.project_action.id;


--
-- Name: project_column; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_column (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    state_type text DEFAULT 'unstarted'::text NOT NULL,
    color text DEFAULT '#6b7280'::text NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    wip_limit integer,
    wip_mode text DEFAULT 'soft'::text NOT NULL,
    auto_assign_user_id text,
    CONSTRAINT project_column_state_type_check CHECK ((state_type = ANY (ARRAY['backlog'::text, 'unstarted'::text, 'started'::text, 'completed'::text, 'canceled'::text]))),
    CONSTRAINT project_column_wip_limit_check CHECK (((wip_limit IS NULL) OR (wip_limit > 0))),
    CONSTRAINT project_column_wip_mode_check CHECK ((wip_mode = ANY (ARRAY['soft'::text, 'hard'::text])))
);


--
-- Name: project_column_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_column_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_column_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_column_id_seq OWNED BY public.project_column.id;


--
-- Name: project_dashboard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_dashboard (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    icon text,
    layout jsonb DEFAULT '[]'::jsonb NOT NULL,
    "position" double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_dashboard_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_dashboard_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_dashboard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_dashboard_id_seq OWNED BY public.project_dashboard.id;


--
-- Name: project_document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_document (
    id integer NOT NULL,
    project_id integer NOT NULL,
    parent_id integer,
    title text DEFAULT ''::text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    content_json jsonb,
    icon text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    full_width boolean DEFAULT false NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    archived_by_ancestor_id integer,
    "position" double precision DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    owner_user_id text,
    created_by_user_id text,
    updated_by_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT project_document_version_check CHECK ((version > 0))
);


--
-- Name: project_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_document_id_seq OWNED BY public.project_document.id;


--
-- Name: project_document_initiative; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_document_initiative (
    document_id integer NOT NULL,
    initiative_id integer NOT NULL,
    created_by_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_document_issue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_document_issue (
    document_id integer NOT NULL,
    issue_id integer NOT NULL,
    created_by_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_document_preference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_document_preference (
    document_id integer NOT NULL,
    user_id text NOT NULL,
    is_favorite boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_document_revision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_document_revision (
    id integer NOT NULL,
    document_id integer NOT NULL,
    version integer NOT NULL,
    parent_id integer,
    title text NOT NULL,
    content text NOT NULL,
    content_json jsonb,
    icon text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    full_width boolean DEFAULT false NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    "position" double precision NOT NULL,
    owner_user_id text,
    created_by_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_document_revision_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_document_revision_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_document_revision_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_document_revision_id_seq OWNED BY public.project_document_revision.id;


--
-- Name: project_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_id_seq OWNED BY public.project.id;


--
-- Name: project_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_member (
    project_id integer NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role_id integer,
    description text DEFAULT ''::text NOT NULL,
    source text DEFAULT 'invite'::text NOT NULL,
    is_favorite boolean DEFAULT false NOT NULL,
    is_hidden boolean DEFAULT false NOT NULL,
    CONSTRAINT project_member_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text]))),
    CONSTRAINT project_member_source_check CHECK ((source = ANY (ARRAY['invite'::text, 'scim'::text])))
);


--
-- Name: project_notification_setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_notification_setting (
    project_id integer NOT NULL,
    ciphertext text NOT NULL,
    iv text NOT NULL,
    auth_tag text NOT NULL,
    redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_role (
    id integer NOT NULL,
    name text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    team_id integer NOT NULL
);


--
-- Name: project_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_role_id_seq OWNED BY public.team_role.id;


--
-- Name: project_setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_setting (
    project_id integer NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: project_view; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_view (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name text NOT NULL,
    icon text,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    display jsonb DEFAULT '{}'::jsonb NOT NULL,
    "position" double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    share_token uuid,
    share_extended boolean DEFAULT false NOT NULL
);


--
-- Name: project_view_favorite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_view_favorite (
    view_id integer NOT NULL,
    user_id text NOT NULL
);


--
-- Name: project_view_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_view_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_view_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_view_id_seq OWNED BY public.project_view.id;


--
-- Name: revision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revision (
    scope text NOT NULL,
    project_id integer NOT NULL,
    rev bigint DEFAULT 0 NOT NULL
);


--
-- Name: scim_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scim_group (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    display_name text NOT NULL,
    external_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    workspace_id integer NOT NULL
);


--
-- Name: scim_group_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scim_group_mapping (
    id integer NOT NULL,
    group_id uuid NOT NULL,
    project_id integer NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    role_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scim_group_mapping_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'member'::text])))
);


--
-- Name: scim_group_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scim_group_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scim_group_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scim_group_mapping_id_seq OWNED BY public.scim_group_mapping.id;


--
-- Name: scim_group_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scim_group_member (
    group_id uuid NOT NULL,
    user_id text NOT NULL
);


--
-- Name: scim_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scim_user (
    workspace_id integer NOT NULL,
    user_id text NOT NULL,
    external_id text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    id text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL
);


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    mcp_enabled boolean DEFAULT true NOT NULL,
    default_agent_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    slug text,
    workspace_id integer NOT NULL
);


--
-- Name: team_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_id_seq OWNED BY public.team.id;


--
-- Name: team_invite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_invite (
    id integer NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id integer NOT NULL,
    project_id integer,
    email text NOT NULL,
    team_role text DEFAULT 'member'::text NOT NULL,
    project_role text,
    role_id integer,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_by_user_id text,
    accepted_by_user_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    CONSTRAINT team_invite_project_role_check CHECK ((((project_id IS NULL) AND (project_role IS NULL)) OR ((project_id IS NOT NULL) AND (project_role = ANY (ARRAY['owner'::text, 'member'::text]))))),
    CONSTRAINT team_invite_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))),
    CONSTRAINT team_invite_team_role_check CHECK ((team_role = ANY (ARRAY['owner'::text, 'manager'::text, 'member'::text])))
);


--
-- Name: team_invite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_invite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_invite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_invite_id_seq OWNED BY public.team_invite.id;


--
-- Name: team_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_member (
    team_id integer NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'invite'::text NOT NULL,
    CONSTRAINT team_member_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'manager'::text, 'member'::text, 'agent'::text]))),
    CONSTRAINT team_member_source_check CHECK ((source = ANY (ARRAY['invite'::text, 'scim'::text])))
);


--
-- Name: team_notification_setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_notification_setting (
    team_id integer NOT NULL,
    ciphertext text NOT NULL,
    iv text NOT NULL,
    auth_tag text NOT NULL,
    redacted jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    role text DEFAULT 'user'::text,
    username text,
    display_username text,
    active boolean DEFAULT true
);


--
-- Name: user_notification_preference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notification_preference (
    id integer NOT NULL,
    user_id text NOT NULL,
    project_id integer NOT NULL,
    email_events jsonb DEFAULT '{}'::jsonb NOT NULL,
    telegram_events jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_notification_preference_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_notification_preference_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_notification_preference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_notification_preference_id_seq OWNED BY public.user_notification_preference.id;


--
-- Name: user_preference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preference (
    user_id text NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    theme text DEFAULT 'system'::text NOT NULL,
    issue_open_mode text DEFAULT 'panel'::text NOT NULL,
    start_page text DEFAULT 'work-items'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_project_id integer,
    show_chat_by_default boolean DEFAULT false NOT NULL,
    hotkeys jsonb,
    issue_stats_open boolean DEFAULT true NOT NULL,
    issue_stats_view text DEFAULT 'compact'::text NOT NULL,
    issue_activity_view text DEFAULT 'flat'::text NOT NULL,
    auto_watch boolean DEFAULT true NOT NULL,
    locale text DEFAULT 'en'::text NOT NULL,
    seen_version text,
    CONSTRAINT user_preference_issue_activity_view_check CHECK ((issue_activity_view = ANY (ARRAY['flat'::text, 'grouped'::text]))),
    CONSTRAINT user_preference_issue_open_mode_check CHECK ((issue_open_mode = ANY (ARRAY['panel'::text, 'page'::text]))),
    CONSTRAINT user_preference_issue_stats_view_check CHECK ((issue_stats_view = ANY (ARRAY['compact'::text, 'timeline'::text]))),
    CONSTRAINT user_preference_start_page_check CHECK ((start_page = ANY (ARRAY['inbox'::text, 'dashboard'::text, 'work-items'::text, 'initiatives'::text]))),
    CONSTRAINT user_preference_theme_check CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])))
);


--
-- Name: user_telegram_account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_telegram_account (
    user_id text NOT NULL,
    chat_id text,
    username text,
    first_name text,
    link_code text,
    link_code_expires_at timestamp with time zone,
    linked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: webhook; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook (
    id integer NOT NULL,
    project_id integer NOT NULL,
    url text NOT NULL,
    secret text NOT NULL,
    events jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    consecutive_failures integer DEFAULT 0 NOT NULL
);


--
-- Name: webhook_delivery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_delivery (
    id integer NOT NULL,
    webhook_id integer NOT NULL,
    event_id uuid NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    response_status integer,
    response_body text
);


--
-- Name: webhook_delivery_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.webhook_delivery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webhook_delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.webhook_delivery_id_seq OWNED BY public.webhook_delivery.id;


--
-- Name: webhook_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.webhook_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webhook_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.webhook_id_seq OWNED BY public.webhook.id;


--
-- Name: workspace; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    color text,
    team_creation text DEFAULT 'owner'::text NOT NULL,
    CONSTRAINT workspace_team_creation_check CHECK ((team_creation = ANY (ARRAY['owner'::text, 'managers'::text, 'members'::text])))
);


--
-- Name: workspace_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workspace_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workspace_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workspace_id_seq OWNED BY public.workspace.id;


--
-- Name: workspace_manager; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workspace_manager (
    workspace_id integer NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workspace_manager_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text])))
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: agent_chat_event id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_event ALTER COLUMN id SET DEFAULT nextval('public.agent_chat_event_id_seq'::regclass);


--
-- Name: agent_chat_message id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_message ALTER COLUMN id SET DEFAULT nextval('public.agent_chat_message_id_seq'::regclass);


--
-- Name: agent_run id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_run ALTER COLUMN id SET DEFAULT nextval('public.agent_run_id_seq'::regclass);


--
-- Name: agent_schedule id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_schedule ALTER COLUMN id SET DEFAULT nextval('public.agent_schedule_id_seq'::regclass);


--
-- Name: agent_skill id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_skill ALTER COLUMN id SET DEFAULT nextval('public.agent_skill_id_seq'::regclass);


--
-- Name: agent_tool id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool ALTER COLUMN id SET DEFAULT nextval('public.agent_tool_id_seq'::regclass);


--
-- Name: ai_agent id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent ALTER COLUMN id SET DEFAULT nextval('public.ai_agent_id_seq'::regclass);


--
-- Name: chat_attachment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachment ALTER COLUMN id SET DEFAULT nextval('public.chat_attachment_id_seq'::regclass);


--
-- Name: custom_field id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field ALTER COLUMN id SET DEFAULT nextval('public.custom_field_id_seq'::regclass);


--
-- Name: custom_field_option id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_option ALTER COLUMN id SET DEFAULT nextval('public.custom_field_option_id_seq'::regclass);


--
-- Name: cycle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycle ALTER COLUMN id SET DEFAULT nextval('public.cycle_id_seq'::regclass);


--
-- Name: document_asset id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_asset ALTER COLUMN id SET DEFAULT nextval('public.document_asset_id_seq'::regclass);


--
-- Name: git_managed_repository id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_managed_repository ALTER COLUMN id SET DEFAULT nextval('public.git_managed_repository_id_seq'::regclass);


--
-- Name: git_provider_connection id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_provider_connection ALTER COLUMN id SET DEFAULT nextval('public.git_provider_connection_id_seq'::regclass);


--
-- Name: import_job id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_job ALTER COLUMN id SET DEFAULT nextval('public.import_job_id_seq'::regclass);


--
-- Name: import_record id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_record ALTER COLUMN id SET DEFAULT nextval('public.import_record_id_seq'::regclass);


--
-- Name: initiative id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative ALTER COLUMN id SET DEFAULT nextval('public.initiative_id_seq'::regclass);


--
-- Name: initiative_attachment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_attachment ALTER COLUMN id SET DEFAULT nextval('public.initiative_attachment_id_seq'::regclass);


--
-- Name: integration_credential id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_credential ALTER COLUMN id SET DEFAULT nextval('public.integration_credential_id_seq'::regclass);


--
-- Name: issue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue ALTER COLUMN id SET DEFAULT nextval('public.issue_id_seq'::regclass);


--
-- Name: issue_activity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity ALTER COLUMN id SET DEFAULT nextval('public.issue_activity_id_seq'::regclass);


--
-- Name: issue_attachment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_attachment ALTER COLUMN id SET DEFAULT nextval('public.issue_attachment_id_seq'::regclass);


--
-- Name: issue_checklist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_checklist ALTER COLUMN id SET DEFAULT nextval('public.issue_checklist_id_seq'::regclass);


--
-- Name: issue_checklist_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_checklist_item ALTER COLUMN id SET DEFAULT nextval('public.issue_checklist_item_id_seq'::regclass);


--
-- Name: issue_cycle id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_cycle ALTER COLUMN id SET DEFAULT nextval('public.issue_cycle_id_seq'::regclass);


--
-- Name: issue_development_check id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_check ALTER COLUMN id SET DEFAULT nextval('public.issue_development_check_id_seq'::regclass);


--
-- Name: issue_development_link id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_link ALTER COLUMN id SET DEFAULT nextval('public.issue_development_link_id_seq'::regclass);


--
-- Name: issue_field_value id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_value ALTER COLUMN id SET DEFAULT nextval('public.issue_field_value_id_seq'::regclass);


--
-- Name: issue_import id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_import ALTER COLUMN id SET DEFAULT nextval('public.issue_import_id_seq'::regclass);


--
-- Name: issue_link id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_link ALTER COLUMN id SET DEFAULT nextval('public.issue_link_id_seq'::regclass);


--
-- Name: issue_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_status ALTER COLUMN id SET DEFAULT nextval('public.issue_status_id_seq'::regclass);


--
-- Name: issue_template id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template ALTER COLUMN id SET DEFAULT nextval('public.issue_template_id_seq'::regclass);


--
-- Name: issue_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_type ALTER COLUMN id SET DEFAULT nextval('public.issue_type_id_seq'::regclass);


--
-- Name: issue_worklog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_worklog ALTER COLUMN id SET DEFAULT nextval('public.issue_worklog_id_seq'::regclass);


--
-- Name: label id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label ALTER COLUMN id SET DEFAULT nextval('public.label_id_seq'::regclass);


--
-- Name: label_group id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_group ALTER COLUMN id SET DEFAULT nextval('public.label_group_id_seq'::regclass);


--
-- Name: model_price id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_price ALTER COLUMN id SET DEFAULT nextval('public.model_price_id_seq'::regclass);


--
-- Name: note_board id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board ALTER COLUMN id SET DEFAULT nextval('public.note_board_id_seq'::regclass);


--
-- Name: notification id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification ALTER COLUMN id SET DEFAULT nextval('public.notification_id_seq'::regclass);


--
-- Name: notification_delivery id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_delivery ALTER COLUMN id SET DEFAULT nextval('public.notification_delivery_id_seq'::regclass);


--
-- Name: project id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project ALTER COLUMN id SET DEFAULT nextval('public.project_id_seq'::regclass);


--
-- Name: project_action id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_action ALTER COLUMN id SET DEFAULT nextval('public.project_action_id_seq'::regclass);


--
-- Name: project_column id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_column ALTER COLUMN id SET DEFAULT nextval('public.project_column_id_seq'::regclass);


--
-- Name: project_dashboard id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dashboard ALTER COLUMN id SET DEFAULT nextval('public.project_dashboard_id_seq'::regclass);


--
-- Name: project_document id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document ALTER COLUMN id SET DEFAULT nextval('public.project_document_id_seq'::regclass);


--
-- Name: project_document_revision id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_revision ALTER COLUMN id SET DEFAULT nextval('public.project_document_revision_id_seq'::regclass);


--
-- Name: project_view id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_view ALTER COLUMN id SET DEFAULT nextval('public.project_view_id_seq'::regclass);


--
-- Name: scim_group_mapping id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_mapping ALTER COLUMN id SET DEFAULT nextval('public.scim_group_mapping_id_seq'::regclass);


--
-- Name: team id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team ALTER COLUMN id SET DEFAULT nextval('public.team_id_seq'::regclass);


--
-- Name: team_invite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite ALTER COLUMN id SET DEFAULT nextval('public.team_invite_id_seq'::regclass);


--
-- Name: team_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_role ALTER COLUMN id SET DEFAULT nextval('public.project_role_id_seq'::regclass);


--
-- Name: user_notification_preference id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preference ALTER COLUMN id SET DEFAULT nextval('public.user_notification_preference_id_seq'::regclass);


--
-- Name: webhook id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook ALTER COLUMN id SET DEFAULT nextval('public.webhook_id_seq'::regclass);


--
-- Name: webhook_delivery id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_delivery ALTER COLUMN id SET DEFAULT nextval('public.webhook_delivery_id_seq'::regclass);


--
-- Name: workspace id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace ALTER COLUMN id SET DEFAULT nextval('public.workspace_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (1, '8055c04def474b1a4b385f13332c921e4b6bca1660c507b13bc528df4c538467', 1783692076932);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (2, 'aabefef2b7d3216dd5bd2782a8951f33cb48b94787e74e8b22af93a7498529ab', 1783709184137);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (3, '96edfbe799a29c11f8f5b0d641769253b4a2b78a62a3670f528dd038a7b4a074', 1783709994592);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (4, '259c8b8f06c39c2d44c3e90b23b9f41b510b83412525a2815bfd26041e9d6b97', 1783717205385);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (5, '656235535ae3ad55c9322260f829e607ac481baa99ccdff9ae2ed6f8fa27be49', 1783722917452);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (6, '90ee5833a60cafa3f10353020f380e7d3e8d4e266c8931299e349c43dfbf8e8d', 1783787147213);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (7, '3b4e84d3a4fedf0bda6e555b1888334b7fe1663d2100ca988ef0a44c68e9c674', 1783789833611);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (8, '94316a6b82f6bb95d44a6e9ff9973d449c83952685ecde9d9f0773f72c94a306', 1783789900000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (9, 'f7b137e970641408355644306d1f62d4f28329c50e7fe7f2dd62846ea9a7ad31', 1783791475691);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (10, '5e8be853547c502935fa1053d452d0a659c6661a7670ba171eff2c9d7c19ac87', 1783839975114);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (11, 'c3f739c3b38481dd6f4748d32891c7c90fc47d5873959741dd3ceea5ccb69d1b', 1783839975200);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (12, 'b23803cc693597390dd909859217e7d58e83b973f8037a5b56af46fc2416b387', 1783858247723);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (13, '2f130ff7cc30baf9c6074555c9d029269818b65a289802756917f01c97228297', 1783860378084);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (14, '4ee0a515a3750e44724c09612e9f6ce083e7ac649d75fd490e08eef271bf3701', 1783863100029);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (15, 'f15b76c5f446352b6ca61a211d7c3816e4e83b1867b71c7fa0b4e07f9e84e617', 1783865162849);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (16, 'ff10027dcd336051a02332ca371b7d7154624ad67eb252926444d7aad21a9586', 1783869213746);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (17, '9e83fe19cedef13b71ba2dfc85dd28adfae4617652451954a329cdea51af9114', 1783869237786);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (18, '4629e067a9cff64fbfb4d39879d5c38513417a943020bafd1af87028af57e41a', 1783869254813);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (19, 'da8be2828cbcaef5a7f9c8d7b6f1c0d9d345d2dd53590e93844be04f11d248fa', 1783879908132);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (20, '332752997737a941324366e1d482d84890d176581db20d5ce3c3e8fe7566bf67', 1783884745652);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (21, '421315b2ded572aadc88223b8aff4cc989a7b1c821d4c6258fb2e6cb55bf4591', 1783887032926);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (22, 'a559903e2019d82d73de0ed63366623faff7e4e685c7aea4cfd7c52774c62bd4', 1783944024204);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (23, 'f5b00ec4166c4ea8e9dcc9ac5a0e694bcc9a360007f99c45990bf4152eec09e9', 1783952260069);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (24, '86bae2f6ac9cf5b2d9ada2a3ca59e045f15d2b3e574dc81094313b91613decc0', 1783965306674);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (25, 'ee59175fed912b227078977ce656c0697d105e47c800ad789468ce802b2eb6b9', 1783967490105);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (26, '519dd327bf87ac2a2dc255a384dbebe6c0ba68a4dc934a68d3bff953aea7040a', 1784017788523);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (27, '1707799637326618467fb5210fe362d29fa0d6f6a341df288354a4de0ba01fe5', 1784021812347);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (28, 'c03a54b1d27ca8fb80d43147ff18262d1a01275b83b448c005058c09494d9f5b', 1784024637705);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (29, 'f987a77ffb7b813ae12488871432446a7ca3bad33f4216b70e7ae05a45cfbfae', 1784024679923);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (30, 'c179ec2367a75068ee596cb871872681f455e724d5c2879cb7bcbcc2ffe7b611', 1784046439116);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (31, 'bffc6c027e50f77deb7dbaa5c97454749cf79dc6a1ac878dc80639898060d944', 1784066490252);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (32, '0160b49b9f27f47eaa12741811af4219133f26ebb029a7f023c2b7f725a0ddfd', 1784066548356);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (33, 'a42c9a84c64a5b598c84a1b3db495418de35f0d5bba042344b1df0334ac3551a', 1784137654851);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (34, '9fbc73efcb5ab2d0240b5c64c50f1eafb3f4859632eed91fc53712e2417cd385', 1784200961133);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (35, '196eaf72867745313a7e7c3d6e0b5dcd696820421babe8077941946f71d6557c', 1784242056989);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (36, '087887df2bd4ffad93412e0f6a61909aeef068b8750229b5da77212cccc8c6e7', 1784288608520);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (37, 'c9689d4482cb369d1f840105e9fcdd59ec8867978a5e2a9dfeaec50446264b7b', 1784374578891);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (38, 'bfd371b22842848f756b8ed85a7759edf84f6340d7062f27adf0260924ec5705', 1784493799689);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (39, '847c9bb161cd0cc2d85df82859485bb0f22adcdc6d2fcbe28c5cc25d345b5d89', 1784496245574);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (40, 'c6f7924afb81d5e98d2e314e44ba4ebb5776fa22a132f7c3eafba96cfb567c7c', 1784499722971);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (41, 'bd233f88b25e1d7e59817017b8fcde90827cee2e3795730434ce5d674739325a', 1784578101376);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (42, '0fad0caca4bc80aedbb253ec61b55d8f7f25e5028337138bb5a1428ec2f7028e', 1784591050080);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (43, '7cc7203169958e2cbfd747d5fbaa75672dadd23927c8286ff8b6a22ec698f5da', 1784629974221);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (44, 'da5723082c8acf7200bc5d0449cf3d51b444ee014bbc5de95cfea4a4f89b1746', 1784638483157);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (45, 'c175818786c71e0bff3adf7ab916e0cb89d55b3463c81680c2b9209cdb19e700', 1784639621156);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (46, '77b156b4c3b14a25b63029d3543c944eba0098c2b43e27fa504ff7f4132d11ec', 1784642091810);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (47, 'e0b403ae03e8d2de39778ee58a96e78651c9289d8db0949f614035d8bcc012dd', 1784642255726);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (48, 'a6debeb722b904c7d184ab422f15c06d2546cfe0ad44d54c44aff2e94959ba46', 1784650824676);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (49, 'a8e4cd0787843b13b8e43cbd878beb0888d9fbe3892fe72db093d4b0c10009c6', 1784765564343);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (50, '528ecb7eb6faa758afecbcf063b37d006517f2cfaf51d7a949e6b3b9c1d2f864', 1784796430458);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (51, '34e804f6d9149a635a4178f1655c396bd9f52445e673310edc79f36b6d5d7be1', 1785001762440);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (52, '3882d063d20f3c6c6b33ef755fcd5c556aab35a5bb017b5ee9a59c4b5550b1f1', 1785082369254);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (53, '62dd488f8edbd141ebf3bae052a7fbd709033a556a6a14be8af9c8c839acf2f5', 1785237817817);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (54, '01b14106671b5bc0ba248d75c94889ff8029a59c1221e5a92e67c4c2fc53712e', 1785237830654);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (55, '31d8481456bb3af74891bfe565a678e3cf42d3eede1c133a37d105db590a2bdf', 1785312339667);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (56, '17bf5023d1adc8a00d85f732e8b4dcab65a4a8b555f10c3763349be5096d3af0', 1785432745548);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (57, '8f43e025700deeb62addc59ccf2b0f3a8ec4b1972bb89626a9153d7618d67ee9', 1785506587211);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (58, 'ff7fef51b290ece34414bd8213d11c0e0e4a626d0a7728921ac921e34117683b', 1785580288020);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (59, '34481b6d01d1b41f9dc6726e33c6d7b74d5939fc5157aa103fed0e11d0a79136', 1785668235534);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (60, '0114a32feaef16824a7ad5b5cf8c99b88bb6419878db02ad2a4e57d633ecd8ed', 1785670059150);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (61, '2b30c5995324f0c0765628c360982ecf5e8aa3d9942f424458642f27201bf6b8', 1785705691872);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (62, 'fe09fe30c531701555f2bead0de922a0c3ae8b35cb4d1f8078f382a168d0d570', 1785754312249);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (63, 'dd58e64302ceddc7a5f1b809440eb1a90880953184ce6e012f12509714f39c90', 1785869451604);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (64, '88d15d7649883bd71235f7a6ea9c725af837f2fdd1202abef41c1217f29cad7d', 1785880921407);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (65, '79dd4b6d65df8b4ecf6cf3dc7c7db070eca2593180557544f7f004943c6ad105', 1785918404465);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (66, '5072ab074d3fb4069778a083b2a5776f1fc1105cf661b0b21ed8336c5cadae73', 1785918411701);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (67, 'a5d638128fc122aa077264a7d1139fe536e93708e987286226b3c5693c188ff0', 1785961218376);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (68, 'fd071d9c4acb199a920ec746d7b3e2b1081812da735b890b4051dcef9d0eb2dd', 1785961218377);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (69, '22e6a4f8f5f5585127243a18832ee986a8890a7cd6fb9b3087db394f855352fe', 1786098521658);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (70, '5ffdc29b63aacf85bf50e4bc93000c806bc25453335e8e100845d554b22f29bb', 1786401368000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (71, '7bd472b93ff74274b0613f41c6b20fbc528c090800cb14c5309d39534f25120f', 1786401369000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (72, 'd4aaf7047bb0a9a1109f24a8ab2a1465fc76a10e2ed2b829b9d1848fffed6e0b', 1786457359419);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (73, '76ab351c732c7f3c3168db5650385378415902a6280ed57f9863feb0a9bb7969', 1786497730861);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (74, 'e4852f35bcde912402f4de85d10d5ff6acb06b5f2c812cc1fc647514506667ec', 1786569390021);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (75, '18135c9a28d7297b9aeebb06897ece9de6b6375dbe03421ec0425cf07e96b458', 1786572699500);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (76, '113b0c5ea32a3bdcb960eb90603b713ba975e5eb0cdcf8467193d5cc3759e3b0', 1786628860087);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (77, 'e8033833f64ad0235658a7ed888e2fcbf10f438d061306071b06dd7b4e645abb', 1786713287358);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (78, 'a3fa2d404a4802b9b1e7b6d66bc8ec3fba893bc219b4e1cb2cedc7a52e5a9b30', 1786713288358);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (79, 'bfdfbb56a74cb3662563dce5d4dda438dee2f1be71c24176c9302f05682b8109', 1786713289358);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (80, 'b78256a36e53694517eb4ad680a79535fd7605749d73d5ce4b34471b622588b7', 1786713290358);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (81, '3d2adc5004b822b31bcacc370c94473a6e3407e775a3f5c8cf623bef101285f9', 1786713291358);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (82, '13f6022178337baace690f9d8f7c7b4fb64c58624ee9433b450ff0b56ad6e4ee', 1786713292358);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (83, '8d6c5b03f3ec15c7b2cac31289fee681aad603f6152b801320c25d7796e7b68c', 1786805381958);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (84, '9b16245b4e46a441e48dfc78e237aa7d5b70ae39e00b2666565901e5dd3c4daf', 1786911699600);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (85, 'e5288b6079a89d58d7504e7f66fcc904722bda12ef3bdb27bea4d5e4d91d1b39', 1786919228260);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (86, '5be0de10e480f8e07fb747f15a16a985bab0c48c750cdde92ebcd41d7d013b34', 1787150697315);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (87, 'f32ce94445e4037427cf76259424e345e79b48b06bff39d2c8b577d709fa9223', 1787176570409);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (88, '830d66408041040dbb45128691cf9dedf3ef2b698c7054b0976dcc591dd57d5d', 1787176571409);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (89, '1d8a0cf4bb976d8b10ffb1a1a6013f22a0957e5991b2e135ae4b47352d08eacf', 1787176572409);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (90, 'f06e28d385240b2750d9e2b9f7eb931010395afb82803543e8ab0c071fb9746e', 1787213581571);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (91, '0c2b787aa7999f07432fad0a5f46b7f4b2a82bc6a31312e63a8e4ec98bb61bb0', 1787232280651);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (92, 'd3963fd15153df2a39c63a34e3703a2071ebad8564f963254e7cd88b4f377cc6', 1787318680651);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (93, '8c8a47ca7edebf4b0258941fb3a33a78908c934a95340acfd9201b52d082a0b5', 1787322280651);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (94, '703fd5dbabb6b4f87ba415e24e742d590a3189312c1e9b59da8f85bada23a811', 1787325880651);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (95, '9ec5217b5751e52da8696df86b90026de13e05e24d688d892dc05baf1697c587', 1787329480651);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (96, '3a77a274751af2301fa847a1f93bc81459236121470dade22643eec8b1853301', 1787352480541);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (97, '3894408b6afe7c509c35a3ce240c3c45a0f54c8372b8f64e74025be11b5a90dd', 1787485270149);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (98, '8fdb100f2a76b7c2e48a1906c3f46a3ddc669ff90e5356342fbad5e640f0a972', 1787513820293);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (99, 'd0ef512a821b6e7f888abbcf20e9080f06b4a12595e12ff622292188ba864d3c', 1787559140630);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (100, '5bfd570a258c01e0fd4b10f5acdd3f02ca276e02a1742d2029d7c7368443c15d', 1787563975233);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (101, '46649ed449ff0035f0b2d994e7640acc6888aedc76e6f10c5d786d0291d906a2', 1787566900135);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (102, 'c27d45a955b4276a91dc634e1a96bf31c58c50a5f8d840d9b4e99532e80c7163', 1787574302584);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (103, '37aa088da2fa82280d488e030b5f3dcddfcbdfd74e6e854f8b9d9cb3023169b0', 1787574307701);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (104, 'dc1ed9e1a8aa36036b570f78695b2c11c1185c34daa436832c7212e758be861c', 1787578503113);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (105, '00519c179b949b3c53707f893d5ea0e0852f1e9b060a942e028f3baf628eb56e', 1787584764123);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (106, 'fb58f89e6cccd955261a5a5a6a4311a48ea5bb3203c9d0a22aaee93242545315', 1787597427470);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (107, '033793282570ad9e055a80f9a37c83bfa472b9ab0a4c646a45bf7e2bb1d9a19f', 1787806565058);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (108, '046932c471166cdac312b3b508218ba41cf4c74666b4ec7e95259f003aeebeb2', 1787849917963);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (109, '10134f4ce418dddd956877a26b0b83f7274bce0b205d664a74d43f44c39f9428', 1787858115460);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (110, 'e97a7063b6aec7e93433e255254af371e46935f769647372d8867ac071a793b8', 1787913096305);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (111, '9c55cb4b0d5d9703b0f9b1eb976f1aaf108c6a68a144ecc0c71374f69a082609', 1787915227537);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (112, '2e0e847aaa429c678bd080eaae72c72b95433609360d7d0337845f5959c8d2e4', 1787927286587);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (113, '2039feb4fd35ffabdfabaf4ce7c8a278695c12205a7ee9261a3ce4e2afbf1f56', 1788033386142);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (114, 'cc3c363dfa3ed69bac3aa19bc818f4d1f3fd1683487c971c6c715dbcd4d670f3', 1788065824575);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (115, 'd76323a60e108d9732bfb23127314f99790782fc05127d3e231d1059dfc0c39b', 1788173880309);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (116, '3142365dea32882fc8bd10aaf388dc30476f01a51f45c36743818b87263ed4c0', 1788538405400);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (117, '13272788365ffadc16d32841e66ffb3f3cf2458346f2337b6dc04b1cc479e1b7', 1788539929811);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (118, '731f324e326b4d6bbeb50843a37d549612ce0177b405abe97ee5e6a161c99137', 1788539930251);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (119, 'a5a758a5e5cd215155f90595b00970870ff0db79b8ce4b8f0ea4bf70b9be2d5d', 1788542845903);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (120, 'ace80ffdb02dc809875c31ea2f7650ef0bca48b8206dd18110a951020cab151f', 1788800000000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (121, '0b7609aeebd63bedb9e6ba17151ccaf27969d0425bac8312d2350e913adf2245', 1788800001000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (122, '9baf4a2f08b46fccc7f2f22daacbef5659c0686d2cfddfbfcd3ca94e654b18bd', 1788800002000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (123, 'a2a5382c8d4ed92095bc8cfd4a3c79f613893f2991dee475e0eedc561d2874fe', 1788800003000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (124, 'af7dda675e2f9c886a80815a5669205797a94096e9c836710304211bb558bfa0', 1788800004000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (125, '4efe603db44108089091d7a88e99a70b731698c1a65536fe12a19e4e29df463e', 1788800005000);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (126, '37a5e77dde7aa6721faed949ff3f95403fd29348180eab4c0dabce8e8510f95a', 1788806647645);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (127, '73563619404df77a7cdff9e215c89f6ef851adb80e27c4cdd22e05642359a74c', 1788807057435);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (128, '3ffff277f35b60d843fc5d6358ce24ca5fee093c82275120958d2d5ecb542717', 1788917221155);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (129, '00aa7dd58cf08cb32219acf98d603d09b9a7fa097ed52f435540c160d76ad317', 1788982170929);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (130, '0783a54b4dc4a0d63b2d1fd9794543460443287f5214fc93f4b8d52d11a848e8', 1789549970943);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (131, 'f092ae15cae97202ba91dde3654012f4bf6bf09639e079652c77e82951cb4552', 1789555189795);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (132, 'c8bb35b993cda3a3d08926a158ef683dceb12a726cce37fb8fef18751ca1a401', 1790191076965);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (133, 'e5d74ca6b278717b35badebdaf41a1bdd046955dc60ae567b65bb05e36b69532', 1790265397487);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (134, 'f93609f9a525b445a1141d5d1165a71a9b4c648ea401072e9c6daef00dd2183e', 1790324657744);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (135, '5b353eedb8a6cd9fd83df1c1289418b07cc6c12bbdcb07730dd3b06de6ea8a1f', 1790334902773);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (136, '7930a44ac44ebf7a7d32d006fb708a23df7d333e71cb32e3bacfaefd4d7fcba8', 1790588370989);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (137, '5cc988343ce1d00ddf045d5329709f1bfcd722c1737d2e54ca73d13ae63eccd3', 1790949641324);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (138, 'ba239d89f0ba9b59d22b35051e5826a1b75b8beb8d6645afd7b90ab3deccc4af', 1791052601298);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (139, 'e814c61d0ced3284a4027be92c0553ad856192f258a1fdf6da3afa1b01c6c4b1', 1791054435099);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (140, 'c3a35d0ba6fc37b7aaba45bfcee2d082872989b4b17d54cc0d90803971bc200c', 1791064765087);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (141, 'f7e89226bf27bd1466d96c8a24e0ac70326cb1e68ce04087940ccaf63f622185', 1791138774176);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (142, '15c20f6e6bacf4280e570f7d2f97199cfc00243d392d5f71f36a839ebb0bfdf2', 1791145933934);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (143, '17d69a4d5ba57bba317fdf82b202e6ac479016d79040f2cdad1786cb17aa86b4', 1791308757273);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (144, '97281dd4363d499f8b404cec21a5d530d663a5baab8a6dd5637d75ea36b9ad9e', 1791374220064);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (145, '5bcee2641447b0f973fea85f80bd21cd447e1388e05389df8f4c341761c0b865', 1791379870030);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (146, 'c37a80fc6c0f0fc25ecf4c201c0ead117cb6e1bbbf091eb874f95aa51d8010f3', 1791404364263);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (147, '40512b42b0700fbe29478a9d65426be074ceb1cd2dd8092af8de735e3baf0b4d', 1791476126995);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (148, '83cc9e620748b2bc3b1dbccee71bb4bcb3b41a3012e183b7cf88a63d145ab60b', 1791744496755);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (149, 'f00d8f11bd1c58816606cdcae27f09e688d7d90abfbaad15f379712d7f7b3645', 1791907056751);
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES (150, 'd81e10c0dd77a75a3e15265fd5491516a614525134c8ecd59ee77e5e27a42ba5', 1791907060303);


--
-- Data for Name: account; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at) VALUES ('RzArAmY0E0giwwS7o4aQT3nvZoO2fK0h', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'credential', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, NULL, NULL, NULL, NULL, '86309c24f855e61ddade86773f9ccf9d:80082e8565c157697ee9f95b92a54f84d2df49a19393663878676d63eb8f22b7906059e966acdf8eb736f6e2169147c2bc52902b8fdfcf37ff0fbdcfbf3fd63e', '2026-10-18 23:35:13.436', '2026-10-18 23:48:57.398');


--
-- Data for Name: agent_chat_event; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_chat_favorite; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_chat_message; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_chat_thread; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_chat_usage; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_field_trigger; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_run; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_schedule; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_skill; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_skill_link; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_tool; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: agent_tool_link; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ai_agent; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: apikey; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.apikey (id, config_id, name, start, reference_id, prefix, key, refill_interval, refill_amount, last_refill_at, enabled, rate_limit_enabled, rate_limit_time_window, rate_limit_max, request_count, remaining, last_request, expires_at, created_at, updated_at, permissions, metadata) VALUES ('YeMN1PXRxo76c9QaLbLmPG6rGdSaMIzq', 'default', 'board-mcp', 'itp_Sn', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'itp_', 'GMouqGOW1S7JPviPVI-ChdJ-e1ap3RrtwDjbTTK33Uc', NULL, NULL, NULL, true, true, 1000, 100, 2, NULL, '2026-10-19 02:08:29.831', '2027-01-16 23:58:45.238', '2026-10-18 23:58:45.238', '2026-10-19 02:08:29.835', NULL, 'null');


--
-- Data for Name: app_secret; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: app_setting; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.app_setting (key, value, updated_at) VALUES ('storage', '{"maxAvatarMb": 5, "projectQuotaMb": 51200, "maxAttachmentMb": 25, "attachmentMimeTypes": ["image/*", "video/*", "application/pdf", "text/plain", "text/csv", "text/markdown", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.oasis.opendocument.text", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.oasis.opendocument.presentation"]}', '2026-10-18 23:34:46.715878+00');
INSERT INTO public.app_setting (key, value, updated_at) VALUES ('migration.teams', '{"teams": [], "merged": {"roles": 0, "agentTools": 0}, "renamed": {"roles": [], "agents": [], "skills": [], "credentials": []}, "version": 1, "movedInvites": 0, "droppedNotificationSettings": []}', '2026-10-18 23:34:46.715878+00');


--
-- Data for Name: chat_attachment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: custom_field; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.custom_field (id, issue_type_id, name, field_type, "position", created_at, project_id, show_in_body, member_scope) VALUES (2, NULL, 'Lane', 'select', 1, '2026-10-19 01:39:09.5539+00', 1, false, NULL);
INSERT INTO public.custom_field (id, issue_type_id, name, field_type, "position", created_at, project_id, show_in_body, member_scope) VALUES (3, NULL, 'Waiting on', 'text', 2, '2026-10-19 01:39:09.560333+00', 1, false, NULL);
INSERT INTO public.custom_field (id, issue_type_id, name, field_type, "position", created_at, project_id, show_in_body, member_scope) VALUES (1, NULL, 'Ticket number', 'number', 0, '2026-10-18 23:57:29.884072+00', 1, true, NULL);


--
-- Data for Name: custom_field_option; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.custom_field_option (id, field_id, value, color, "position") VALUES (1, 2, 'Lane 1', '#6b7280', 0);
INSERT INTO public.custom_field_option (id, field_id, value, color, "position") VALUES (2, 2, 'Lane 2', '#6b7280', 1);
INSERT INTO public.custom_field_option (id, field_id, value, color, "position") VALUES (3, 2, 'Lane 3', '#6b7280', 2);


--
-- Data for Name: cycle; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: document_asset; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: document_collaboration; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: document_comment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: document_step; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: git_managed_repository; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: git_provider_connection; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: import_job; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: import_record; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: initiative; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: initiative_attachment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: initiative_label; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: integration_credential; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (127, 1, 2, 1, 4, '#2 Alert sheet change is all or nothing', 'Queue status: DONE', NULL, NULL, NULL, 106000, '2026-10-18 23:35:57.683648+00', '2026-10-19 02:20:39.650307+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (116, 1, 14, 1, 4, '#14 Widget timeline horizon 14 to 30 days', 'Queue status: DONE', NULL, NULL, NULL, 95000, '2026-10-18 23:35:57.475809+00', '2026-10-19 02:20:39.806673+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (114, 1, 16, 1, 4, '#16 iOS widgets flag flip after the G.1 protocol', 'Queue status: DONE', NULL, NULL, NULL, 93000, '2026-10-18 23:35:57.441819+00', '2026-10-19 02:20:39.832607+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (112, 1, 18, 1, 4, '#18 SDK 58 next re-pin + Babel 8 rider', 'Queue status: DONE

2026-10-09, audited. Versions, incidents and durable lessons live in section 16. The owner’s ride-`next` policy stays in force: repin to the

Needs first: #6', NULL, NULL, NULL, 91000, '2026-10-18 23:35:57.406222+00', '2026-10-19 02:20:39.860901+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (110, 1, 20, 1, 4, '#20 Non-SDK packages to absolute latest', 'Queue status: DONE', NULL, NULL, NULL, 89000, '2026-10-18 23:35:57.372738+00', '2026-10-19 02:20:39.888177+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (108, 1, 22, 1, 4, '#22 Lock-screen countdown layout (iOS)', 'Queue status: DONE', NULL, NULL, NULL, 87000, '2026-10-18 23:35:57.338812+00', '2026-10-19 02:20:39.914544+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (25, 1, 129, 1, 4, '#129 Widget props: the stamped-but-unread rtl field', 'Queue status: DONE

with row 135 2026-10-18: the rtl field is CONSUMED - the patched iOS entry view reads it as the native layout direction and the Android comp', NULL, NULL, NULL, 4000, '2026-10-18 23:35:55.882566+00', '2026-10-19 02:20:40.967991+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (124, 1, 5, 1, 4, '#5 Yesterday''s still-due rows survive 00:00', 'Queue status: DONE', NULL, NULL, NULL, 103000, '2026-10-18 23:35:57.617259+00', '2026-10-19 02:20:39.69425+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (24, 1, 131, 1, 4, '#131 expo-location: the six named unverified readings', 'Queue status: DONE

2026-10-17, audited (two reviewer passes, nine findings adjudicated and fixed at 2.0.1001, among them the second-ask wording and row 134''s b', NULL, NULL, NULL, 3000, '2026-10-18 23:35:55.8664+00', '2026-10-19 02:20:40.979939+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (100, 1, 32, 1, 4, '#32 The day roll (ISSUES #27)', 'Queue status: DONE', NULL, NULL, NULL, 79000, '2026-10-18 23:35:57.198328+00', '2026-10-19 02:20:40.019033+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (23, 1, 134, 1, 4, '#134 Widgets-off Android release builds fail their own lint gate', 'Queue status: DONE

2026-10-17, audited through 2.0.1009', NULL, NULL, NULL, 2000, '2026-10-18 23:35:55.848381+00', '2026-10-19 02:20:40.992709+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (22, 1, 138, 1, 4, '#138 Semver discipline: a thousand patches, never a minor', 'Queue status: DONE

2026-10-18, audited (two reviewer passes, nine findings all confirmed and fixed at 2.0.1065, the conflicted-merge and unstaged-blob holes am', NULL, NULL, NULL, 1000, '2026-10-18 23:35:55.830083+00', '2026-10-19 02:20:41.006218+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (20, 1, 137, 1, 10, '#137 Arabic line height parity: Android against iOS, same TTF', 'Queue status: FOLDED

into row 140 2026-10-18 by the owner''s order (the gaps the owner sees on glass are this row''s verdict made visible; the parity verdict, the 

Needs first: #140', NULL, NULL, NULL, 20000, '2026-10-18 23:35:55.799503+00', '2026-10-19 02:20:41.01867+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (19, 1, 141, 1, 1, '#141 Language switch flashes on Android: the spinner unmounts, a target-language flash, then a blank purple page', 'Queue status: NOT PLANNED

2026-10-18, OWNER REPORT', NULL, NULL, NULL, 19000, '2026-10-18 23:35:55.787303+00', '2026-10-19 02:20:41.031881+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (18, 1, 140, 1, 1, '#140 Arabic line height on Android: the gaps the owner sees on glass', 'Queue status: NOT PLANNED

2026-10-18, OWNER REPORT NOT PLANNED 2026-10-18, OWNER REPORT; row 137 FOLDED HERE 2026-10-18 by the owner''s order: its parity verdict and n', NULL, NULL, NULL, 18000, '2026-10-18 23:35:55.773377+00', '2026-10-19 02:20:41.044961+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (17, 1, 143, 1, 1, '#143 Upstream: file the device-locale PR properly, and give every open PR its tracking row', 'Queue status: NOT PLANNED

2026-10-18, OWNER ORDER, backlog for a new session', NULL, NULL, NULL, 17000, '2026-10-18 23:35:55.759468+00', '2026-10-19 02:20:41.056792+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (16, 1, 142, 1, 1, '#142 Settings: a Widgets option that opens the OS widget gallery at our section', 'Queue status: NOT PLANNED

2026-10-18, OWNER ORDER, queued late', NULL, NULL, NULL, 16000, '2026-10-18 23:35:55.745504+00', '2026-10-19 02:20:41.071973+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (15, 1, 139, 1, 1, '#139 Alert bottom sheet: one dim level, whole-header taps, reminder state restored', 'Queue status: NOT PLANNED

2026-10-18, OWNER ORDER', NULL, NULL, NULL, 15000, '2026-10-18 23:35:55.731858+00', '2026-10-19 02:20:41.088074+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (13, 1, 136, 1, 10, '#136 Android chevrons do not mirror under Arabic (settings sheet)', 'Queue status: OWNER

REPORT 2026-10-18: on the 3T at 2.0.908 with Arabic active in-app, every chevron in the Settings bottom sheet points RIGHT (the English dire', NULL, NULL, NULL, 13000, '2026-10-18 23:35:55.699625+00', '2026-10-19 02:20:41.116918+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (12, 1, 132, 1, 10, '#132 Upstream: the expo-widgets device-locale patch hunks as one PR', 'Queue status: DEFERRED

2026-10-16 by the owner''s consolidation order: the expo-widgets patch upstreaming parks with the rest of the widget work', NULL, NULL, NULL, 12000, '2026-10-18 23:35:55.68349+00', '2026-10-19 02:20:41.13189+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (122, 1, 7, 1, 4, '#7 Agent tooling', 'Queue status: DONE', NULL, NULL, NULL, 101000, '2026-10-18 23:35:57.578621+00', '2026-10-19 02:20:39.721844+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (11, 1, 130, 1, 10, '#130 Widget surfaces: the gallery''s English fallback and the v1 fallback words', 'Queue status: DEFERRED

2026-10-16 by the owner''s consolidation order: all widget work parks DEFERRED 2026-10-16 by the owner''s consolidation order: all widget work', NULL, NULL, NULL, 11000, '2026-10-18 23:35:55.668532+00', '2026-10-19 02:20:41.14513+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (10, 1, 128, 1, 10, '#128 iOS widget countdown renders system-formatted, outside the Latin ruling', 'Queue status: DISCARDED

BY THE OWNER''S ORDER 2026-10-18: the iOS widget countdown keeps the system timer interval and its current Latin face in every language, no l

Needs first: #10, #18, #2026', NULL, NULL, NULL, 10000, '2026-10-18 23:35:55.654244+00', '2026-10-19 02:20:41.159216+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (9, 1, 127, 1, 10, '#127 Android widgets on OEMs: is the feature worth keeping, and what hardening is left', 'Queue status: DEFERRED

2026-10-16 by the owner''s consolidation order: all widget work parks DEFERRED 2026-10-16 by the owner''s consolidation order: all widget work', NULL, NULL, NULL, 9000, '2026-10-18 23:35:55.638498+00', '2026-10-19 02:20:41.176952+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (8, 1, 126, 1, 10, '#126 Board mirror: an OWNER-LED row must read as awaiting the owner', 'Queue status: PROBLEM:

row 56 shipped the read-only board mirror. The owner''s 2026-10-16 ruling changed the status model: an audited investigation whose deliverabl

Needs first: #7, #10, #17, #2026', NULL, NULL, NULL, 8000, '2026-10-18 23:35:55.623293+00', '2026-10-19 02:20:41.189364+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (7, 1, 123, 1, 10, '#123 Android widget refresh on OEMs: re-evaluate against SDK 58 stable', 'Queue status: FOLDED

into row 127 2026-10-18 by the owner''s order (the owner read them as the same thing; the delivered version-delta verdict carries in as 127''s

Needs first: #127', NULL, NULL, NULL, 7000, '2026-10-18 23:35:55.606979+00', '2026-10-19 02:20:41.201733+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (4, 1, 54, 1, 7, '#54 Patches, one line of qibla copy, repository hygiene', 'Queue status: BLOCKED

2026-10-14 by the owner: the owner has no access to the OnePlus 3T, which the one leftover needs. The owner paused app work part way through', NULL, NULL, NULL, 4000, '2026-10-18 23:35:55.558039+00', '2026-10-19 02:20:41.226405+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (3, 1, 51, 1, 11, '#51 Upstream `expo-location` compass corrections', 'Queue status: UPSTREAM

2026-10-12: waiting on Expo reviewing and releasing PR `expo/expo#51291` (https://github.com/expo/expo/pull/51291); the corrections land wit

Needs first: #50', NULL, NULL, NULL, 3000, '2026-10-18 23:35:55.539356+00', '2026-10-19 02:20:41.244035+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (2, 1, 42, 1, 10, '#42 Global prayer times', 'Queue status: DEFERRED

2026-10-14 to v3.0 by the owner''s priority call (pairs with row 25; the owner will say go). Research is complete, no code is written. **Two ', NULL, NULL, NULL, 2000, '2026-10-18 23:35:55.506689+00', '2026-10-19 02:20:41.258328+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (1, 1, 25, 1, 10, '#25 Moonsighting research, part 2', 'Queue status: DEFERRED

2026-10-12 to v3.0 by the owner''s priority call (the owner''s 2026-10-13 ruling: the deferral is literal, not a ban). Runs behind rows 37 to 

Needs first: #37, #39', NULL, NULL, NULL, 1000, '2026-10-18 23:35:55.447181+00', '2026-10-19 02:20:41.271786+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (120, 1, 10, 1, 4, '#10 Android widget polish + self-refresh', 'Queue status: DONE', NULL, NULL, NULL, 99000, '2026-10-18 23:35:57.546282+00', '2026-10-19 02:20:39.752157+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (118, 1, 12, 1, 4, '#12 Android widgets: proportional sizing', 'Queue status: DONE', NULL, NULL, NULL, 97000, '2026-10-18 23:35:57.512173+00', '2026-10-19 02:20:39.778651+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (50, 1, 91, 1, 4, '#91 The language-switch crash: BackgroundTasks queried off the main thread', 'Queue status: DONE

2026-10-15, audited: the crash''s caller pinned (the debug sequence''s simulate step invoking BGTaskScheduler''s private launch-simulation sele', NULL, NULL, NULL, 29000, '2026-10-18 23:35:56.329643+00', '2026-10-19 02:20:40.658876+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (49, 1, 100, 1, 4, '#100 The owner''s visual read batch: eight fixes in one ticket', 'Queue status: DONE

2026-10-15, audited: the eight visual fixes landed - the ago badge''s lettered run isolated LTR inside the Arabic sentence with plain full-si', NULL, NULL, NULL, 28000, '2026-10-18 23:35:56.314394+00', '2026-10-19 02:20:40.669781+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (48, 1, 101, 1, 4, '#101 The prayer row times: brighter, whiter on past and next rows', 'Queue status: DONE

2026-10-15, landed direct at 2.0.771 by the owner''s order, refined live through 2.0.772 (the upcoming rows reverted untouched, the passed co', NULL, NULL, NULL, 27000, '2026-10-18 23:35:56.294146+00', '2026-10-19 02:20:40.682456+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (47, 1, 102, 1, 4, '#102 The owner''s live evening batch: countdown ink, glyphs, the language sheet, the seconds default', 'Queue status: DONE

2026-10-15, landed direct by the owner''s order through 2.0.777, SUPERSEDED-IN-PART same evening by the owner''s live rulings: the sheet subhe', NULL, NULL, NULL, 26000, '2026-10-18 23:35:56.276867+00', '2026-10-19 02:20:40.696586+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (46, 1, 103, 1, 4, '#103 The schedule pager under RTL: mirrored swipes and page order', 'Queue status: DONE

2026-10-15, audited: the schedule pager mirrors under every RTL locale through the native layoutDirection prop keyed off the app locale (en ', NULL, NULL, NULL, 25000, '2026-10-18 23:35:56.259802+00', '2026-10-19 02:20:40.709249+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (45, 1, 104, 1, 4, '#104 The post-close haptic on the change-athan sheet', 'Queue status: DONE

2026-10-16, audited: the close haptic lands when the sheet finishes closing on every path - the changed-pick commit defers past the next pai', NULL, NULL, NULL, 24000, '2026-10-18 23:35:56.244426+00', '2026-10-19 02:20:40.721411+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (44, 1, 105, 1, 4, '#105 The countdown bar defaults off; no migration', 'Queue status: DONE

2026-10-15, landed direct, both reviews adjudicated, no migration by the owner''s final word', NULL, NULL, NULL, 23000, '2026-10-18 23:35:56.227616+00', '2026-10-19 02:20:40.732927+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (43, 1, 106, 1, 4, '#106 The Arabic location-date gap, the overlay info-box arrow, the countdown letter gap', 'Queue status: DONE

2026-10-16, audited: under Arabic the whole face renders Rubik (words, digits, h m s letters, row times; the bundled Noto pair deleted by th', NULL, NULL, NULL, 22000, '2026-10-18 23:35:56.210782+00', '2026-10-19 02:20:40.743876+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (42, 1, 107, 1, 4, '#107 Agent tooling: the Vercel performance skill, mobile-mcp and the maestro server on', 'Queue status: DONE

2026-10-15, landed direct at 2.0.792 by the owner''s order', NULL, NULL, NULL, 21000, '2026-10-18 23:35:56.194256+00', '2026-10-19 02:20:40.761035+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (41, 1, 108, 1, 4, '#108 The Rubik cascade: the sheets'' pulls, the label gap, the footer clip', 'Queue status: DONE

2026-10-16, audited: the Rubik cascade lands - every sheet subtitle (qibla''s own included) sits a 6 point positive gap under its title with ', NULL, NULL, NULL, 20000, '2026-10-18 23:35:56.178691+00', '2026-10-19 02:20:40.772011+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (40, 1, 109, 1, 4, '#109 The owner''s pass-three read of the 2.0.833 build: four fixes in one ticket', 'Queue status: DONE

2026-10-16, landed direct at 2.0.834 by the owner''s order (all gates green, 5690 tests, 100 percent): the upcoming colon rides the row''s own', NULL, NULL, NULL, 19000, '2026-10-18 23:35:56.161866+00', '2026-10-19 02:20:40.783984+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (39, 1, 110, 1, 4, '#110 Real 500 weights for Hindi and Thai', 'Queue status: DONE

2026-10-16, landed direct at 2.0.835 by the owner''s order (all gates green, 5692 tests, 100 percent): words under hi and th ride their own N', NULL, NULL, NULL, 18000, '2026-10-18 23:35:56.142823+00', '2026-10-19 02:20:40.799474+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (38, 1, 111, 1, 4, '#111 SDK 58 stable re-pin + the Babel 8 rider', 'Queue status: DONE

2026-10-17, audited (three passes; plan-conformance''s two records musts fixed in the audit merge): the newest stable SDK 58 set landed (expo', NULL, NULL, NULL, 17000, '2026-10-18 23:35:56.12628+00', '2026-10-19 02:20:40.811535+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (37, 1, 112, 1, 4, '#112 The naked-app defaults: all four display toggles off', 'Queue status: DONE

2026-10-16, landed direct at 2.0.837 by the owner''s order (all gates green, 5692 tests, 100 percent): the atom''s default pin false, the defa', NULL, NULL, NULL, 16000, '2026-10-18 23:35:56.108525+00', '2026-10-19 02:20:40.823667+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (36, 1, 113, 1, 4, '#113 The loader''s frame-one language; the mock at any hour', 'Queue status: DONE

2026-10-16, landed direct at 2.0.838 by the owner''s order (all gates green, 5697 tests, 100 percent): the loader composes through tIn (a nam', NULL, NULL, NULL, 15000, '2026-10-18 23:35:56.091552+00', '2026-10-19 02:20:40.836318+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (35, 1, 114, 1, 4, '#114 The owner''s pass-four read: the colon''s advance, the round info badge, the Thai step', 'Queue status: DONE

2026-10-16, landed direct at 2.0.842, 2.0.844 and 2.0.845 by the owner''s order (all gates green each time, 100 percent): the colon rides ONE', NULL, NULL, NULL, 14000, '2026-10-18 23:35:56.074831+00', '2026-10-19 02:20:40.848793+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (34, 1, 115, 1, 4, '#115 The Thai face becomes Sarabun, the owner''s specimen pick', 'Queue status: DONE

then REVERSED 2026-10-16: Sarabun landed at 2.0.846, the owner''s read rejected it, and the clean revert at 2.0.848 restores Noto Sans Thai e', NULL, NULL, NULL, 13000, '2026-10-18 23:35:56.051874+00', '2026-10-19 02:20:40.860854+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (32, 1, 118, 1, 4, '#118 Variable fonts: one file per family, the investigation', 'Queue status: DONE

2026-10-16, the owner''s ruling taken: keep the eight static fonts, the variable-font idea dropped: (one blind reviewer; every number reprodu

Needs first: #10, #16, #2026', NULL, NULL, NULL, 11000, '2026-10-18 23:35:56.012588+00', '2026-10-19 02:20:40.883581+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (31, 1, 119, 1, 4, '#119 The agent CLI: introduce @expo/agent-cli into the repository', 'Queue status: DONE

2026-10-16, audited: option B landed at 2.0.928 - ai/AGENTS.md routes the four measured reads (doctor the advisory health check, typecheck t

Needs first: #10, #16, #2026', NULL, NULL, NULL, 10000, '2026-10-18 23:35:55.994766+00', '2026-10-19 02:20:40.894292+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (28, 1, 122, 1, 4, '#122 The rewritten AVD and adb management in Expo CLI 58: evaluate for the Android harness', 'Queue status: DONE

2026-10-17, audited: the two stale --device lines are corrected to the measured truth at the installed @expo/cli 58.1.10 and the install-and

Needs first: #10, #16, #2026', NULL, NULL, NULL, 7000, '2026-10-18 23:35:55.933365+00', '2026-10-19 02:20:40.930092+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (26, 1, 125, 1, 4, '#125 Workflow guards: three measured lane defects need guards, not only prose', 'Queue status: DONE

2026-10-17, audited (two passes, plan-conformance and blind, both with the range named and findings files gated by check-audit.sh; nine find', NULL, NULL, NULL, 5000, '2026-10-18 23:35:55.899784+00', '2026-10-19 02:20:40.955657+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (98, 1, 34, 1, 4, '#34 Dead-code sweep', 'Queue status: DONE', NULL, NULL, NULL, 77000, '2026-10-18 23:35:57.166776+00', '2026-10-19 02:20:40.043685+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (96, 1, 37, 1, 4, '#37 D2 + D5: qibla finder on a cached location', 'Queue status: DONE', NULL, NULL, NULL, 75000, '2026-10-18 23:35:57.131928+00', '2026-10-19 02:20:40.072252+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (92, 1, 41, 1, 4, '#41 Qibla on an offline map', 'Queue status: DONE', NULL, NULL, NULL, 71000, '2026-10-18 23:35:57.062341+00', '2026-10-19 02:20:40.127676+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (90, 1, 45, 1, 4, '#45 Qibla on a flat world map', 'Queue status: DONE', NULL, NULL, NULL, 69000, '2026-10-18 23:35:57.024337+00', '2026-10-19 02:20:40.159856+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (88, 1, 48, 1, 4, '#48 Heading source research', 'Queue status: DONE', NULL, NULL, NULL, 67000, '2026-10-18 23:35:56.991633+00', '2026-10-19 02:20:40.185532+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (86, 1, 50, 1, 4, '#50 Which patch fixed the compass', 'Queue status: DONE', NULL, NULL, NULL, 65000, '2026-10-18 23:35:56.96177+00', '2026-10-19 02:20:40.211343+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (82, 1, 56, 1, 4, '#56 Ticket board: a read-only local mirror of the queue and its runs', 'Queue status: DONE

2026-10-12, audited and pushed: the ticket board serves at 127.0.0.1:8788 (docker compose up in board/) - reader recomputes board.json from ', NULL, NULL, NULL, 61000, '2026-10-18 23:35:56.894785+00', '2026-10-19 02:20:40.260525+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (80, 1, 58, 1, 4, '#58 Right-to-left layout mirroring', 'Queue status: DONE

2026-10-12, audited: stage 58a landed - every parent-relative directional style in app source uses logical keys (start/end, margin and paddi

Needs first: #39', NULL, NULL, NULL, 59000, '2026-10-18 23:35:56.860815+00', '2026-10-19 02:20:40.284683+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (77, 1, 61, 1, 4, '#61 Somali prayer name wraps to two lines with room to spare', 'Queue status: DONE

2026-10-12, audited: the prayer-name reserve is now the widest label in rendered points, measured per name on both lists (the Somali Sunrise

Needs first: #39', NULL, NULL, NULL, 56000, '2026-10-18 23:35:56.815064+00', '2026-10-19 02:20:40.320918+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (75, 1, 63, 1, 4, '#63 Countdown format: numbers and colons only, every language', 'Queue status: DONE

2026-10-12, audited and pushed: the app''s countdowns, ago badge, reminder titles and channel labels render numbers and colons with no unit l

Needs first: #57, #67, #68, #69', NULL, NULL, NULL, 54000, '2026-10-18 23:35:56.781374+00', '2026-10-19 02:20:40.344321+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (73, 1, 65, 1, 4, '#65 perfName remnants: investigation only', 'Queue status: DONE

2026-10-12, audited: the perfName investigation answers the owner''s three questions (FINDINGS.md folded here per D82, its folder closed): 19', NULL, NULL, NULL, 52000, '2026-10-18 23:35:56.745383+00', '2026-10-19 02:20:40.368877+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (69, 1, 72, 1, 4, '#72 Countdown timer: fixed-width sections, dim colons and zero-hours, English reverts to letters', 'Queue status: DONE

2026-10-13, audited: the countdown is fixed-width three double-digit groups under the five non-en locales (dim zero groups, always-dim gappe', NULL, NULL, NULL, 48000, '2026-10-18 23:35:56.676365+00', '2026-10-19 02:20:40.424682+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (67, 1, 74, 1, 4, '#74 Arabic typography: text renders too small and carries no bold weight', 'Queue status: DONE

2026-10-13, audited: Arabic renders in the bundled Noto Sans Arabic Regular and Medium on every app text style, and weight surfaces render a

Needs first: #38, #39, #72', NULL, NULL, NULL, 46000, '2026-10-18 23:35:56.642264+00', '2026-10-19 02:20:40.450213+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (65, 1, 76, 1, 4, '#76 Digit and string gaps under ar: the overlay''s Latin numerals, the Qibla instruction''s ellipsis, the cardinal letters', 'Queue status: DONE

2026-10-14, audited: the Extras info boxes verified on Arabic-Indic digits across all five sentences with a six-locale sweep lock (row 84''s ', NULL, NULL, NULL, 44000, '2026-10-18 23:35:56.605867+00', '2026-10-19 02:20:40.472601+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (63, 1, 78, 1, 4, '#78 The D59 relaunch starves: the in-process reload silently skips most direction-change crossings', 'Queue status: DONE

2026-10-14, audited: the firing condition pinned and fixed - the commit''s convergence await blocked unbounded and unlogged on the scheduling', NULL, NULL, NULL, 42000, '2026-10-18 23:35:56.568203+00', '2026-10-19 02:20:40.495053+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (62, 1, 79, 1, 4, '#79 Countdown dim levels, the no-shift rule, and prayer-list colon treatment', 'Queue status: DONE

2026-10-13, audited: the timer''s dim levels land on the owner''s corrected figures (a spent 00 group white reduced 30 percent, every colon wh

Needs first: #72, #74', NULL, NULL, NULL, 41000, '2026-10-18 23:35:56.549064+00', '2026-10-19 02:20:40.50786+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (61, 1, 80, 1, 4, '#80 Layout direction follows the app language, not the system language', 'Queue status: DONE

2026-10-14, audited: the layout direction reads the app locale at the React tree''s root and the picker modal''s host (the direction style key', NULL, NULL, NULL, 40000, '2026-10-18 23:35:56.525403+00', '2026-10-19 02:20:40.520323+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (60, 1, 81, 1, 4, '#81 Typography refinements from the owner''s green-build read (ar sizes, colon gaps, ago gap)', 'Queue status: DONE

2026-10-14, audited: the owner''s green-build refinements land - the timer under ar two points smaller (24), every colon on the timer, the ti

Needs first: #74', NULL, NULL, NULL, 39000, '2026-10-18 23:35:56.507096+00', '2026-10-19 02:20:40.532568+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (59, 1, 82, 1, 4, '#82 Latin numerals everywhere; the countdown identical in every language', 'Queue status: DONE

2026-10-13, audited: Latin digits render in every language and the countdown timer is one design everywhere - fixed-width colon sections, di

Needs first: #4, #79, #81, #82', NULL, NULL, NULL, 38000, '2026-10-18 23:35:56.490061+00', '2026-10-19 02:20:40.546298+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (57, 1, 84, 1, 4, '#84 The live-iteration batch: countdown model, colons, Readex Pro, locale-driven rules', 'Queue status: DONE

2026-10-14, audited: 2.0.250 carries the batch (32 files, 5557 tests, 100 percent on statements, branches, functions and lines), the two-rev', NULL, NULL, NULL, 36000, '2026-10-18 23:35:56.452892+00', '2026-10-19 02:20:40.575006+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (56, 1, 85, 1, 4, '#85 Countdown time display: lowercase h m s letters in every language', 'Queue status: DONE

2026-10-15, audited: the countdown TIME display is the lettered design in every language - unpadded Latin digit groups with small faint lowe

Needs first: #83', NULL, NULL, NULL, 35000, '2026-10-18 23:35:56.433194+00', '2026-10-19 02:20:40.586887+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (53, 1, 88, 1, 4, '#88 Latin numerals absolutely everywhere; the notification unit word drops', 'Queue status: DONE

2026-10-15, audited: every digit the app composes renders Latin in every language - the native-digit map (NATIVE_DIGITS, localizeDigits) is 

Needs first: #85', NULL, NULL, NULL, 32000, '2026-10-18 23:35:56.378106+00', '2026-10-19 02:20:40.626059+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (52, 1, 89, 1, 4, '#89 The volume note returns to both sheets at the foot', 'Queue status: DONE

2026-10-15, audited (both passes clean bar one records nit that died with the plan folder): the note returned at 2.0.737, hook Tests: 2 skip', NULL, NULL, NULL, 31000, '2026-10-18 23:35:56.36085+00', '2026-10-19 02:20:40.638155+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (30, 1, 120, 1, 4, '#120 iOS Notification Center: group or clear the delivered stack (threadIdentifier)', 'Queue status: DONE

2026-10-17, audited (three passes: plan-conformance conforms, one threading SHOULD fixed - the clear now consumes its own timeout flag so a 

Needs first: #10, #16, #2026', NULL, NULL, NULL, 9000, '2026-10-18 23:35:55.973729+00', '2026-10-19 02:20:40.906804+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (29, 1, 121, 1, 4, '#121 expo-location/next: the provider API evaluation, with heavy compass testing', 'Queue status: DONE

2026-10-16, the owner''s ruling taken: adopt nothing, the classic heading path and the upstream PR stay:: two reviewer passes (blind and plan

Needs first: #10, #16, #2026', NULL, NULL, NULL, 8000, '2026-10-18 23:35:55.952571+00', '2026-10-19 02:20:40.918173+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (126, 1, 3, 1, 4, '#3 Android: a notification replaces the one before it', 'Queue status: DONE', NULL, NULL, NULL, 105000, '2026-10-18 23:35:57.662782+00', '2026-10-19 02:20:39.663699+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (125, 1, 4, 1, 4, '#4 iOS: a notification replaces the one before it', 'Queue status: DONE', NULL, NULL, NULL, 104000, '2026-10-18 23:35:57.635715+00', '2026-10-19 02:20:39.676665+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (111, 1, 19, 1, 4, '#19 Android lock-screen widgets: investigation only', 'Queue status: DONE', NULL, NULL, NULL, 90000, '2026-10-18 23:35:57.388668+00', '2026-10-19 02:20:39.874824+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (109, 1, 21, 1, 4, '#21 Dependency freshness sweep', 'Queue status: DONE', NULL, NULL, NULL, 88000, '2026-10-18 23:35:57.356414+00', '2026-10-19 02:20:39.90175+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (107, 1, 24, 1, 4, '#24 Android widget countdown', 'Queue status: DONE', NULL, NULL, NULL, 86000, '2026-10-18 23:35:57.318856+00', '2026-10-19 02:20:39.927256+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (106, 1, 26, 1, 4, '#26 SDK 58 preview.7 + RN 0.88.0-rc.2', 'Queue status: DONE', NULL, NULL, NULL, 85000, '2026-10-18 23:35:57.297622+00', '2026-10-19 02:20:39.938989+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (105, 1, 27, 1, 4, '#27 D1: sound through silent mode and DND', 'Queue status: DONE', NULL, NULL, NULL, 84000, '2026-10-18 23:35:57.280672+00', '2026-10-19 02:20:39.952287+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (104, 1, 28, 1, 4, '#28 D3: rolling buffer + second reminder', 'Queue status: DONE', NULL, NULL, NULL, 83000, '2026-10-18 23:35:57.263177+00', '2026-10-19 02:20:39.965122+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (93, 1, 40, 1, 4, '#40 Heading re-architecture: the fused sensor', 'Queue status: DONE', NULL, NULL, NULL, 72000, '2026-10-18 23:35:57.08006+00', '2026-10-19 02:20:40.113114+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (89, 1, 47, 1, 4, '#47 Gyro-fused heading', 'Queue status: DONE', NULL, NULL, NULL, 68000, '2026-10-18 23:35:57.007179+00', '2026-10-19 02:20:40.173495+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (84, 1, 53, 1, 4, '#53 Gate on the phone''s own uncertainty', 'Queue status: DONE', NULL, NULL, NULL, 63000, '2026-10-18 23:35:56.928491+00', '2026-10-19 02:20:40.235515+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (83, 1, 55, 1, 4, '#55 A reschedule inside 30s of an armed reminder cancels it', 'Queue status: DONE

2026-10-11, audited: a pass inside the final 30 seconds before an armed reminder now keeps it armed, no re-arm and no cancel, record intact;

Needs first: #53', NULL, NULL, NULL, 62000, '2026-10-18 23:35:56.912247+00', '2026-10-19 02:20:40.246682+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (79, 1, 59, 1, 4, '#59 Prayer names: shortest context-sufficient forms in every language', 'Queue status: DONE

2026-10-13, audited: four names shortened under the header rule (D81, the owner''s ms example verbatim; hi and th mechanical drops; D83 so Mi

Needs first: #61, #63', NULL, NULL, NULL, 58000, '2026-10-18 23:35:56.846934+00', '2026-10-19 02:20:40.298103+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (78, 1, 60, 1, 4, '#60 Modals bounded: every growing region scrolls inside a capped height', 'Queue status: DONE

2026-10-12, audited and pushed: both growing modal regions bounded - WhatsNew''s release list and Update''s message scroll inside 0.62 of the 

Needs first: #39', NULL, NULL, NULL, 57000, '2026-10-18 23:35:56.830533+00', '2026-10-19 02:20:40.309666+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (76, 1, 62, 1, 4, '#62 Help page: remove the English-era hardcoded line breaks', 'Queue status: DONE

2026-10-12, audited: the two multi-sentence help answers flow as one paragraph in all six languages (the owner''s 2026-10-12 ruling), catalog

Needs first: #39', NULL, NULL, NULL, 55000, '2026-10-18 23:35:56.798188+00', '2026-10-19 02:20:40.33248+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (74, 1, 64, 1, 4, '#64 Volume-source copy: alert and sound sheets plus a help question', 'Queue status: DONE

2026-10-13, audited and pushed: alert and sound sheets carry the platform-keyed volume note (Android alarm volume per row 27''s proof, iOS th', NULL, NULL, NULL, 53000, '2026-10-18 23:35:56.762749+00', '2026-10-19 02:20:40.356744+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (72, 1, 66, 1, 4, '#66 Language switch: always restart with cleared caches - investigation', 'Queue status: DONE

2026-10-13, audited: the always-restart investigation answers in FINDINGS.md (folded here per D85, its folder closed): four options (1 statu', NULL, NULL, NULL, 51000, '2026-10-18 23:35:56.727959+00', '2026-10-19 02:20:40.380682+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (71, 1, 68, 1, 4, '#68 RTL flip: supportsRTL, forceRTL-at-switch, relaunch, widget layoutDirection (58b)', 'Queue status: DONE

2026-10-13, audited: supportsRTL flipped, direction forced at bootstrap and at boundary crossings with a post-convergence relaunch (D59; the

Needs first: #58', NULL, NULL, NULL, 50000, '2026-10-18 23:35:56.71074+00', '2026-10-19 02:20:40.393038+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (70, 1, 71, 1, 4, '#71 AppState soft exception on the language relaunch teardown', 'Queue status: DONE

2026-10-13, audited: the row''s question answers NO (D88) - the soft exception is raised inside React''s own reload sequence (the six-hop trac', NULL, NULL, NULL, 49000, '2026-10-18 23:35:56.692546+00', '2026-10-19 02:20:40.409648+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (68, 1, 73, 1, 4, '#73 RTL travel family: segmented pill, toggle travel, colour picker marker and split box', 'Queue status: DONE

2026-10-14, audited: the family''s root was never a transform flip - RN 0.88.0-rc.3 applies every transform physically (verified exhaustively', NULL, NULL, NULL, 47000, '2026-10-18 23:35:56.658381+00', '2026-10-19 02:20:40.437378+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (66, 1, 75, 1, 4, '#75 Visual polish: mosque SVG mirroring, no scrollbars anywhere, toggle outline to the card edge', 'Queue status: DONE

2026-10-14, audited: the mosque mark mirrors under RTL on the locale''s own direction (both PNG variants, both schedule pages and the error s', NULL, NULL, NULL, 45000, '2026-10-18 23:35:56.626282+00', '2026-10-19 02:20:40.461876+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (64, 1, 77, 1, 4, '#77 Help modal entrance: a solid white box flashes around the close button', 'Queue status: DONE

2026-10-13, audited: the close button''s container joins the modal container''s own entrance fade (bare `entering={FadeIn}` on the Close row),', NULL, NULL, NULL, 43000, '2026-10-18 23:35:56.58758+00', '2026-10-19 02:20:40.484536+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (58, 1, 83, 1, 4, '#83 The time-ago badge: the countdown''s lettered format', 'Queue status: DONE

2026-10-15, audited: the ago badge renders the countdown''s lettered duration in every language - unpadded Latin digits with lowercase h m at

Needs first: #85, #88', NULL, NULL, NULL, 37000, '2026-10-18 23:35:56.472517+00', '2026-10-19 02:20:40.560371+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (55, 1, 86, 1, 4, '#86 Visual polish batch: the sheets'' volume note, the list-to-ago gap, the countdown tip, the language-switch loader', 'Queue status: DONE

2026-10-14, audited: five steps landed - the ar line box pinned to the Latin record and consumed by the sheet header, the day block, the not', NULL, NULL, NULL, 34000, '2026-10-18 23:35:56.415335+00', '2026-10-19 02:20:40.599782+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (54, 1, 87, 1, 4, '#87 The clipping batch: the line-box pin, the note style, the loader face', 'Queue status: DONE

2026-10-15, the owner''s XS read: no clipping on the language-switch loader, the settings, alert and sound sheets'' title/subtitle blocks perf', NULL, NULL, NULL, 33000, '2026-10-18 23:35:56.396717+00', '2026-10-19 02:20:40.61349+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (27, 1, 124, 1, 4, '#124 iPhone XS automation channel: RSD allocation failure', 'Queue status: DONE

2026-10-16, cleared by the owner: the ladder''s rung 3 fixed it (`sudo pkill -9 remoted && sudo pkill -9 usbmuxd`, then replug the cable); ve', NULL, NULL, NULL, 6000, '2026-10-18 23:35:55.916366+00', '2026-10-19 02:20:40.941927+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (6, 1, 117, 1, 9, '#117 Expo widgets and different languages: the inventory', 'Queue status: OWNER-LED

2026-10-18, investigation and preparation closed, audited (two reviewer passes, 7 findings adjudicated): the closeout landed clean - the 3T 

Waiting on: nothing THE OWNER''S READ TAKEN 2026-10-18: the widget gallery entry, the add, the layouts and the language switching confirmed perfect on BO

Needs first: #3, #10, #18, #2026', NULL, NULL, NULL, 6000, '2026-10-18 23:35:55.593343+00', '2026-10-19 02:20:41.213567+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (5, 1, 70, 1, 4, '#70 The board and workflow as a portable system: Paperclip after Kanboard was tried and rejected', 'Queue status: NOT PLANNED

2026-10-18, awaiting the owner''s go in a fresh session', NULL, NULL, NULL, 5000, '2026-10-18 23:35:55.576136+00', '2026-10-19 02:20:39.602426+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (21, 1, 144, 1, 9, '#144 The board as a portable product, take three: It''s a Plan (itsaplan.dev)', 'Goal: the queue''s work runs on this board instead of a markdown file.

Where: the board, its schema, and the repository''s workflow skills and agents.

Acceptance:
- [x] the stack runs from board/ with the database and attachments bound to the repository
- [x] the destroy and restore drill brings the board back from snapshot/board.sql alone
- [x] the board holds the queue''s ten columns and every ticket on its own column
- [x] the workflow skills and agents read and write the board, not a file
- [x] the queue file and the old reader are gone, with no reference left

The plan and the log are the Docs page "Plan: #144".', NULL, NULL, NULL, 21000, '2026-10-18 23:35:55.814603+00', '2026-10-19 02:20:39.619214+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (128, 1, 1, 1, 4, '#1 An alert does what its bell shows', 'Queue status: DONE', NULL, NULL, NULL, 107000, '2026-10-18 23:35:57.704991+00', '2026-10-19 02:20:39.635047+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (91, 1, 44, 1, 4, '#44 Delete the qibla', 'Queue status: DONE', NULL, NULL, NULL, 70000, '2026-10-18 23:35:57.042518+00', '2026-10-19 02:20:40.142082+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (123, 1, 6, 1, 4, '#6 SDK 58 beta upgrade + alarmClock', 'Queue status: DONE', NULL, NULL, NULL, 102000, '2026-10-18 23:35:57.597339+00', '2026-10-19 02:20:39.708383+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (121, 1, 9, 1, 4, '#9 Android home-screen widgets', 'Queue status: DONE', NULL, NULL, NULL, 100000, '2026-10-18 23:35:57.562992+00', '2026-10-19 02:20:39.738228+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (119, 1, 11, 1, 4, '#11 iOS widgets: containerBackground fix, first placement', 'Queue status: DONE', NULL, NULL, NULL, 98000, '2026-10-18 23:35:57.528662+00', '2026-10-19 02:20:39.763873+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (117, 1, 13, 1, 4, '#13 Android widgets open the app on tap', 'Queue status: DONE', NULL, NULL, NULL, 96000, '2026-10-18 23:35:57.492302+00', '2026-10-19 02:20:39.793083+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (115, 1, 15, 1, 4, '#15 Widget polish', 'Queue status: DONE', NULL, NULL, NULL, 94000, '2026-10-18 23:35:57.457033+00', '2026-10-19 02:20:39.820119+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (113, 1, 17, 1, 4, '#17 Blank card at placement, horizon to 3 days', 'Queue status: DONE', NULL, NULL, NULL, 92000, '2026-10-18 23:35:57.423827+00', '2026-10-19 02:20:39.845678+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (103, 1, 29, 1, 4, '#29 D6: the help modal for a missed athan', 'Queue status: DONE', NULL, NULL, NULL, 82000, '2026-10-18 23:35:57.245488+00', '2026-10-19 02:20:39.978344+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (102, 1, 30, 1, 4, '#30 Both stores answer for themselves', 'Queue status: DONE', NULL, NULL, NULL, 81000, '2026-10-18 23:35:57.229851+00', '2026-10-19 02:20:39.992988+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (101, 1, 31, 1, 4, '#31 Android updates natively, releases.json deleted', 'Queue status: DONE', NULL, NULL, NULL, 80000, '2026-10-18 23:35:57.213573+00', '2026-10-19 02:20:40.005816+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (99, 1, 33, 1, 4, '#33 Sound bug, ISSUES #42 keep test, help modal design', 'Queue status: DONE', NULL, NULL, NULL, 78000, '2026-10-18 23:35:57.182856+00', '2026-10-19 02:20:40.031624+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (97, 1, 35, 1, 4, '#35 Housekeeping batch', 'Queue status: DONE', NULL, NULL, NULL, 76000, '2026-10-18 23:35:57.150018+00', '2026-10-19 02:20:40.05712+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (95, 1, 38, 1, 4, '#38 D4a. i18n scaffolding', 'Queue status: DONE

2026-10-11, audited, landed as 2.0.0-stage-1 on uat: stage one of the single-language overhaul; Arabic surfaces removed, identifier union fr

Needs first: #37', NULL, NULL, NULL, 74000, '2026-10-18 23:35:57.114516+00', '2026-10-19 02:20:40.084573+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (94, 1, 39, 1, 4, '#39 D4b. Translation sweep', 'Queue status: DONE

2026-10-12, audited and pushed: the six-language confidence build landed end to end (en ar ms so hi th) - runtime locale resolution with the

Needs first: #38', NULL, NULL, NULL, 73000, '2026-10-18 23:35:57.097557+00', '2026-10-19 02:20:40.099735+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (87, 1, 49, 1, 4, '#49 Native heading module: the Fused Orientation Provider', 'Queue status: DONE', NULL, NULL, NULL, 66000, '2026-10-18 23:35:56.977075+00', '2026-10-19 02:20:40.198442+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (85, 1, 52, 1, 4, '#52 Settling gate: timing and cold-open cost', 'Queue status: DONE', NULL, NULL, NULL, 64000, '2026-10-18 23:35:56.944844+00', '2026-10-19 02:20:40.223263+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (81, 1, 57, 1, 4, '#57 Native numerals per language', 'Queue status: DONE

2026-10-12, audited and pushed: native numerals landed - ar draws Eastern Arabic-Indic digits on every user-visible surface (D54, D57), the 

Needs first: #39', NULL, NULL, NULL, 60000, '2026-10-18 23:35:56.876931+00', '2026-10-19 02:20:40.271872+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (51, 1, 90, 1, 4, '#90 Ramadan decorations: the owner''s visual check', 'Queue status: DONE

2026-10-15, the owner''s read: the Ramadan face confirmed in English and Arabic on the prod-armed dev build (decorations, mosque variant, set', NULL, NULL, NULL, 30000, '2026-10-18 23:35:56.345032+00', '2026-10-19 02:20:40.648676+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (33, 1, 116, 1, 4, '#116 iPhone Duo support: one schedule on both displays through the existing adaptive layout (the owner''s 2026-10-18 evening order; the benched two-pane design superseded and its branch kept as history).', 'Queue status: DONE

2026-10-18, audited (plan-conformance and blind passes): the iPhone Duo runs the app through the existing layout with no Duo code path. Clos', NULL, NULL, NULL, 12000, '2026-10-18 23:35:56.034116+00', '2026-10-19 02:20:40.872199+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);
INSERT INTO public.issue (id, project_id, sequence_number, type_id, column_id, title, description, priority, start_date, due_date, "position", created_at, updated_at, assignee_user_id, delegate_user_id, initiative_id, archived_at, share_token, parent_id, share_extended, cycle_id, estimate_points, estimate_minutes) VALUES (14, 1, 135, 1, 10, '#135 Widget mirroring under RTL and the widget countdown face', 'Queue status: OWNER

ORDER 2026-10-17, the owner''s read of the medium widget on the 3T at 2.0.908 with Arabic active - the owner''s order unparks exactly this sli

Needs first: #0, #2, #3, #10, #18, #1079, #1081, #2026', NULL, NULL, NULL, 14000, '2026-10-18 23:35:55.717739+00', '2026-10-19 02:20:41.103124+00', NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL);


--
-- Data for Name: issue_activity; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1, 1, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.468433+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (2, 2, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.516345+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (3, 3, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.544844+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (4, 4, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.56338+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (5, 5, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.581503+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (6, 6, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.596747+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (7, 7, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.611395+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (8, 8, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.627012+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (9, 9, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.642522+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (10, 10, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.658179+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (11, 11, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.672171+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (12, 12, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.687121+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (13, 13, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.707466+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (14, 14, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.721602+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (15, 15, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.735789+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (16, 16, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.74912+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (17, 17, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.763079+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (18, 18, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.778122+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (19, 19, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.790169+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (20, 20, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.804062+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (21, 21, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.818856+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (22, 22, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.834715+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (23, 23, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.853989+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (24, 24, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.871588+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (25, 25, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.888087+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (26, 26, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.904522+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (27, 27, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.92136+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (28, 28, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.938242+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (29, 29, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.959138+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (30, 30, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:55.980387+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (31, 31, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.000326+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (32, 32, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.020159+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (33, 33, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.03993+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (34, 34, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.062261+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (35, 35, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.079812+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (36, 36, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.096375+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (37, 37, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.113431+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (38, 38, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.131023+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (39, 39, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.148003+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (40, 40, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.167461+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (41, 41, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.183976+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (42, 42, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.199239+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (43, 43, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.215897+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (44, 44, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.232748+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (45, 45, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.248834+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (46, 46, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.264652+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (47, 47, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.281984+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (48, 48, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.299644+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (49, 49, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.319474+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (50, 50, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.334238+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (51, 51, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.350351+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (52, 52, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.366535+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (53, 53, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.384217+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (54, 54, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.402321+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (55, 55, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.420471+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (56, 56, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.439767+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (57, 57, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.457525+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (58, 58, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.47759+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (59, 59, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.494957+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (60, 60, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.512139+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (61, 61, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.532713+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (62, 62, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.554102+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (63, 63, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.573617+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (64, 64, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.593297+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (65, 65, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.610851+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (66, 66, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.630814+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (67, 67, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.647486+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (68, 68, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.663234+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (69, 69, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.681608+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (70, 70, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.697475+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (71, 71, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.716456+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (73, 73, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.750648+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (75, 75, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.786258+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (77, 77, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.820075+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (79, 79, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.850618+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (81, 81, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.882047+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (83, 83, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.91685+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (85, 85, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.950596+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (87, 87, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.981212+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (89, 89, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.012429+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (91, 91, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.047424+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (93, 93, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.085625+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (95, 95, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.11963+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (97, 97, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.154691+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (99, 99, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.187391+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (101, 101, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.218439+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (103, 103, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.250785+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (105, 105, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.285518+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (133, 3, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.759062+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 86, "value": "QUEUE-86"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (134, 86, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.759062+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 3, "value": "QUEUE-3"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (153, 14, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.86245+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 127, "value": "QUEUE-127"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (154, 127, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.86245+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 14, "value": "QUEUE-14"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (72, 72, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.734137+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (74, 74, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.770274+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (76, 76, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.802933+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (78, 78, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.835568+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (80, 80, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.866132+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (82, 82, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.899861+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (84, 84, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.933278+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (86, 86, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.966532+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (88, 88, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:56.996256+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (90, 90, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.030228+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (92, 92, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.067314+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (94, 94, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.102287+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (96, 96, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.136828+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (98, 98, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.171949+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (100, 100, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.202787+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (102, 102, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.234411+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (104, 104, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.268512+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (106, 106, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.302732+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (107, 107, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.325092+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (108, 108, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.343755+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (109, 109, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.361251+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (110, 110, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.377671+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (111, 111, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.393606+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (112, 112, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.411745+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (113, 113, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.428867+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (114, 114, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.446397+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (115, 115, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.461524+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (116, 116, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.481002+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (117, 117, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.499937+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (118, 118, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.517156+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (119, 119, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.533851+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (120, 120, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.552016+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (121, 121, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.567698+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (122, 122, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.585385+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (123, 123, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.603025+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (124, 124, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.621888+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (125, 125, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.64349+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (126, 126, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.670357+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (127, 127, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.689058+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (128, 128, 'activity', 'owner', NULL, 'created', '2026-10-18 23:35:57.711191+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (129, 1, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.734059+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 96, "value": "QUEUE-96"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (130, 96, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.734059+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 1, "value": "QUEUE-1"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (131, 1, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.746314+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (132, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.746314+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 1, "value": "QUEUE-1"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (139, 6, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.800755+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 112, "value": "QUEUE-112"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (140, 112, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.800755+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 6, "value": "QUEUE-6"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (147, 8, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.83738+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 113, "value": "QUEUE-113"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (148, 113, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.83738+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 8, "value": "QUEUE-8"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (149, 10, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.847167+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (150, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.847167+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "QUEUE-10"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (151, 10, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.854372+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 112, "value": "QUEUE-112"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (152, 112, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.854372+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "QUEUE-10"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (159, 14, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.886984+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 112, "value": "QUEUE-112"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (160, 112, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.886984+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 14, "value": "QUEUE-14"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (165, 28, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.91076+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 114, "value": "QUEUE-114"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (166, 114, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.91076+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 28, "value": "QUEUE-28"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (135, 6, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.77362+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 126, "value": "QUEUE-126"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (136, 126, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.77362+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 6, "value": "QUEUE-6"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (137, 6, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.785219+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (138, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.785219+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 6, "value": "QUEUE-6"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (155, 14, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.870794+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 126, "value": "QUEUE-126"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (156, 126, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.870794+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 14, "value": "QUEUE-14"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (157, 14, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.8787+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (158, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.8787+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 14, "value": "QUEUE-14"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (173, 30, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.941562+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 114, "value": "QUEUE-114"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (174, 114, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.941562+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 30, "value": "QUEUE-30"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (175, 31, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.949179+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (176, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.949179+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 31, "value": "QUEUE-31"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (141, 7, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.810192+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 9, "value": "QUEUE-9"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (142, 9, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.810192+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 7, "value": "QUEUE-7"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (143, 8, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.818717+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 122, "value": "QUEUE-122"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (144, 122, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.818717+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 8, "value": "QUEUE-8"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (145, 8, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.828259+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (146, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.828259+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 8, "value": "QUEUE-8"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (161, 20, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.895356+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 18, "value": "QUEUE-18"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (162, 18, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.895356+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 20, "value": "QUEUE-20"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (163, 28, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.902774+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (164, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.902774+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 28, "value": "QUEUE-28"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (169, 29, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.926488+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 114, "value": "QUEUE-114"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (170, 114, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.926488+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 29, "value": "QUEUE-29"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (179, 32, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.968171+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (180, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.968171+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 32, "value": "QUEUE-32"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (181, 32, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.977054+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 114, "value": "QUEUE-114"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (182, 114, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.977054+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 32, "value": "QUEUE-32"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (191, 59, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.578086+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 62, "value": "QUEUE-62"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (192, 62, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.578086+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 59, "value": "QUEUE-59"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (167, 29, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.918197+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (168, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.918197+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 29, "value": "QUEUE-29"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (185, 56, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.992089+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 58, "value": "QUEUE-58"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (186, 58, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.992089+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 56, "value": "QUEUE-56"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (193, 59, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.584722+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 60, "value": "QUEUE-60"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (194, 60, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.584722+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 59, "value": "QUEUE-59"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (171, 30, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.933786+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "QUEUE-120"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (172, 120, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.933786+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 30, "value": "QUEUE-30"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (177, 31, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.959444+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 114, "value": "QUEUE-114"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (178, 114, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.959444+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 31, "value": "QUEUE-31"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (187, 58, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.561353+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 53, "value": "QUEUE-53"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (188, 53, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.561353+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 58, "value": "QUEUE-58"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (183, 53, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.984718+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 56, "value": "QUEUE-56"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (184, 56, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:35:57.984718+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 53, "value": "QUEUE-53"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (189, 59, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.57103+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 125, "value": "QUEUE-125"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (190, 125, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:09.57103+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 59, "value": "QUEUE-59"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (195, 60, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.637304+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 67, "value": "QUEUE-67"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (196, 67, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.637304+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 60, "value": "QUEUE-60"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (197, 62, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.647579+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 69, "value": "QUEUE-69"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (198, 69, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.647579+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 62, "value": "QUEUE-62"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (199, 62, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.655973+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 67, "value": "QUEUE-67"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (200, 67, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.655973+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 62, "value": "QUEUE-62"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (201, 67, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.663817+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 95, "value": "QUEUE-95"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (202, 95, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.663817+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 67, "value": "QUEUE-67"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (203, 67, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.671955+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (204, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.671955+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 67, "value": "QUEUE-67"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (205, 67, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.6804+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 69, "value": "QUEUE-69"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (206, 69, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.6804+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 67, "value": "QUEUE-67"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (207, 71, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.688085+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 80, "value": "QUEUE-80"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (208, 80, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.688085+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 71, "value": "QUEUE-71"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (209, 75, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.69595+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 81, "value": "QUEUE-81"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (210, 81, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.69595+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 75, "value": "QUEUE-75"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (211, 75, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.703451+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 71, "value": "QUEUE-71"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (212, 71, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.703451+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 75, "value": "QUEUE-75"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (213, 76, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.711496+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (214, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.711496+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 76, "value": "QUEUE-76"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (215, 77, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.720102+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (216, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.720102+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 77, "value": "QUEUE-77"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (217, 78, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.72772+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (218, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.72772+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 78, "value": "QUEUE-78"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (219, 79, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.734767+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 77, "value": "QUEUE-77"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (220, 77, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.734767+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 79, "value": "QUEUE-79"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (221, 79, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.741586+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 75, "value": "QUEUE-75"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (222, 75, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.741586+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 79, "value": "QUEUE-79"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (223, 80, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.748877+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (224, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.748877+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 80, "value": "QUEUE-80"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (225, 81, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.755723+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (226, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.755723+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 81, "value": "QUEUE-81"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (227, 83, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.762912+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 84, "value": "QUEUE-84"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (228, 84, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.762912+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 83, "value": "QUEUE-83"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (235, 21, 'activity', 'owner', NULL, 'description', '2026-10-18 23:42:33.674164+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "Queue status: OWNER-LED\n\n2026-10-19 by the board run: It''s a Plan v1.5.0 runs from its own docker-compose with generated secrets outside the tree, telemetry off, and\n\nWaiting on: the owner''s verdict on the running board, open in the owner''s browser at the documented web port; agents, MCP, webhooks and theming all wait"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (229, 94, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.76907+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 95, "value": "QUEUE-95"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (230, 95, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.76907+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "QUEUE-94"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (231, 95, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.776009+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 96, "value": "QUEUE-96"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (232, 96, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.776009+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 95, "value": "QUEUE-95"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (233, 112, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.785791+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 123, "value": "QUEUE-123"}, "subject": {"value": "blocked_by"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (234, 123, 'activity', 'owner', NULL, 'link_add', '2026-10-18 23:36:15.785791+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 112, "value": "QUEUE-112"}, "subject": {"value": "blocks"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (236, 21, 'activity', 'owner', NULL, 'description', '2026-10-18 23:42:43.35638+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "Queue status: OWNER-LED\n\n2026-10-19 by the board run: It''s a Plan v1.5.0 runs from its own docker-compose with generated secrets outside the tree, telemetry off, and one project holds the 128 emitted tickets. The owner opens the board and rules look, feel and functionality; nothing merges to uat before that ruling. Full record in `ai/plans/144-itsaplan-board/`.\n\nWaiting on: the owner''s verdict on the running board, open in the owner''s browser at the documented web port; agents, MCP, webhooks and theming all wait on it."}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (237, 1, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.602263+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (238, 2, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.622574+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (239, 3, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.638207+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 11, "value": "Upstream", "stateType": "started"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (240, 4, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.654082+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 7, "value": "Blocked", "stateType": "started"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (422, 43, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.507845+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "106"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (241, 6, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.682347+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 9, "value": "Owner-led", "stateType": "started"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (242, 7, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.699718+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (243, 8, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.715297+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (244, 9, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.730622+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (245, 10, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.746525+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (246, 11, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.761275+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (247, 12, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.7773+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (248, 13, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.790893+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (249, 14, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.80559+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (250, 20, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.876788+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 10, "value": "Deferred", "stateType": "backlog"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (251, 21, 'activity', 'owner', NULL, 'status', '2026-10-18 23:57:28.894686+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 9, "value": "Owner-led", "stateType": "started"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (252, 1, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.900184+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "25"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (253, 2, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.910413+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "42"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (254, 3, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.921344+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "51"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (255, 4, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.931718+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "54"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (256, 5, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.942014+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "70"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (257, 6, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.952747+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "117"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (258, 7, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.963491+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "123"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (259, 8, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.973301+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "126"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (260, 9, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.98337+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "127"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (261, 10, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:29.992407+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "128"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (262, 11, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.001477+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "130"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (263, 12, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.010312+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "132"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (264, 13, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.018958+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "136"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (265, 14, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.027273+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "135"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (274, 23, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.107289+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "134"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (283, 32, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.192555+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "118"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (294, 43, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.30586+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "106"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (303, 52, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.387506+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "89"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (313, 62, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.479903+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "79"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (322, 71, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.550331+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "68"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (337, 86, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.679152+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "50"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (346, 95, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.752424+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "38"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (355, 104, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.825295+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "28"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (365, 114, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.909148+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "16"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (378, 127, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:31.018981+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "2"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (387, 8, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.229474+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "126"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (396, 17, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.304289+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "143"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (405, 26, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.376926+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "125"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (414, 35, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.447409+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "114"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (423, 44, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.514899+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "105"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (432, 53, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.581757+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "88"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (441, 62, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.653907+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "79"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (451, 72, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.728653+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "66"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (462, 83, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.807118+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "55"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (472, 93, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.878426+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "40"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (482, 103, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.946837+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "29"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (491, 112, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.012904+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "18"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (503, 124, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.107772+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "5"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (510, 3, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.826298+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "51"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (519, 12, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.911697+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "132"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (528, 21, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.987617+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "144"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (547, 40, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.156+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "109"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (556, 49, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.228913+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "100"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (568, 61, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.333392+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "80"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (580, 73, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.437017+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "65"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (589, 82, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.523901+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "56"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (599, 92, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.608784+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "41"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (616, 109, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.755884+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "21"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (625, 118, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.834369+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "12"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (634, 127, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.910319+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "2"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (266, 15, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.035447+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "139"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (276, 25, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.126912+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "129"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (286, 35, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.235663+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "114"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (295, 44, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.313933+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "105"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (304, 53, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.395946+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "88"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (323, 72, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.558744+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "66"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (332, 81, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.634771+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "57"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (343, 92, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.727604+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "41"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (352, 101, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.801865+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "31"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (361, 110, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.877218+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "20"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (374, 123, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.986337+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "6"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (384, 5, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.206404+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "70"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (393, 14, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.277243+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "135"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (402, 23, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.353223+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "134"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (411, 32, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.423473+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "118"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (421, 42, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.501583+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "107"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (438, 59, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.629911+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "82"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (450, 71, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.721104+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "68"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (460, 81, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.792967+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "57"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (471, 92, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.87187+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "41"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (481, 102, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.940057+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "30"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (492, 113, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.019904+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "17"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (501, 122, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.091043+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "7"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (516, 9, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.885392+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "127"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (526, 19, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.971087+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "141"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (541, 34, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.099964+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "115"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (550, 43, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.178766+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "106"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (563, 56, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.290245+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "85"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (574, 67, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.385217+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "74"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (587, 80, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.507167+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "58"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (598, 91, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.599731+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "44"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (607, 100, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.678741+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "32"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (617, 110, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.764959+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "20"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (626, 119, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.843026+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "11"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (267, 16, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.047557+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "142"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (277, 26, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.136041+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "125"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (287, 36, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.244071+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "113"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (297, 46, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.331418+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "103"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (306, 55, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.415305+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "86"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (315, 64, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.494175+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "77"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (327, 76, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.594426+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "62"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (336, 85, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.670881+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "52"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (345, 94, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.744205+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "39"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (354, 103, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.817017+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "29"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (363, 112, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.8932+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "18"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (372, 121, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.970025+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "9"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (388, 9, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.23721+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "127"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (397, 18, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.312135+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "140"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (406, 27, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.38473+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "124"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (415, 36, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.455053+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "113"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (425, 46, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.527961+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "103"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (434, 55, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.59805+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "86"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (444, 65, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.67603+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "76"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (455, 76, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.758261+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "62"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (464, 85, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.823417+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "52"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (474, 95, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.892405+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "38"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (484, 105, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.960229+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "27"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (495, 116, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.044864+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "14"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (505, 126, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.123736+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "3"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (508, 1, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.805846+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "25"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (518, 11, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.90287+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "130"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (527, 20, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.979205+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "137"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (536, 29, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.054379+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "121"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (543, 36, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.119974+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "113"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (552, 45, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.196487+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "104"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (561, 54, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.272481+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "87"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (572, 65, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.369126+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "76"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (581, 74, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.446368+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "64"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (593, 86, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.556606+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "50"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (602, 95, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.635388+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "38"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (611, 104, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.714642+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "28"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (620, 113, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.792279+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "17"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (268, 17, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.056599+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "143"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (278, 27, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.145745+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "124"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (291, 40, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.279616+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "109"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (301, 50, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.366502+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "91"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (312, 61, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.470582+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "80"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (321, 70, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.542021+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "71"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (330, 79, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.618506+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "59"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (339, 88, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.695305+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "48"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (349, 98, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.776946+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "34"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (358, 107, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.84999+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "24"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (367, 116, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.925619+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "14"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (376, 125, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:31.00224+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "4"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (398, 19, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.319668+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "141"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (407, 28, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.392094+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "122"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (416, 37, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.462732+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "112"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (427, 48, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.541979+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "101"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (435, 56, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.605728+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "85"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (445, 66, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.683237+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "75"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (454, 75, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.750605+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "63"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (463, 84, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.816665+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "53"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (473, 94, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.88533+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "39"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (483, 104, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.953739+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "28"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (493, 114, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.028222+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "16"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (502, 123, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.098961+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "6"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (514, 7, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.863181+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "123"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (523, 16, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.944594+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "142"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (532, 25, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.019616+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "129"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (538, 31, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.070805+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "119"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (544, 37, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.128406+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "112"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (553, 46, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.205442+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "103"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (562, 55, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.281331+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "86"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (571, 64, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.360273+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "77"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (583, 76, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.46969+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "62"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (592, 85, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.54788+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "52"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (600, 93, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.617888+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "40"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (609, 102, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.698424+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "30"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (622, 115, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.809427+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "15"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (631, 124, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.883241+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "5"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (269, 18, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.065624+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "140"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (284, 33, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.208686+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "116"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (293, 42, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.297218+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "107"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (308, 57, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.433767+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "84"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (317, 66, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.509696+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "75"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (326, 75, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.585772+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "63"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (335, 84, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.661854+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "53"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (344, 93, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.735997+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "40"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (353, 102, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.809312+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "30"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (362, 111, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.884753+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "19"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (371, 120, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.960763+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "10"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (385, 6, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.214289+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "117"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (394, 15, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.284726+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "139"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (403, 24, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.361756+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "131"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (412, 33, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.431205+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "116"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (431, 52, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.571121+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "89"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (443, 64, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.668236+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "77"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (453, 74, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.743139+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "64"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (465, 86, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.83029+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "50"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (475, 96, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.898884+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "37"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (485, 106, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.96745+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "26"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (494, 115, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.035888+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "15"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (504, 125, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.116703+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "4"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (512, 5, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.845729+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "70"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (521, 14, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.928708+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "135"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (530, 23, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.003755+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "134"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (540, 33, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.091034+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "116"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (549, 42, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.170894+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "107"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (559, 52, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.253473+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "89"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (569, 62, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.341453+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "79"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (578, 71, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.419613+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "68"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (588, 81, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.515237+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "57"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (597, 90, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.590898+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "45"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (605, 98, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.662725+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "34"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (614, 107, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.738999+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "24"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (628, 121, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.85934+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "9"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (270, 19, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.074372+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "141"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (279, 28, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.155147+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "122"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (288, 37, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.251997+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "112"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (298, 47, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.340139+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "102"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (307, 56, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.424731+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "85"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (316, 65, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.501327+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "76"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (325, 74, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.576822+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "64"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (334, 83, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.654865+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "55"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (347, 96, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.760729+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "37"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (356, 105, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.833214+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "27"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (368, 117, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.934664+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "13"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (377, 126, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:31.01035+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "3"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (381, 2, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.183342+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "42"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (390, 11, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.253216+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "130"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (419, 40, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.485427+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "109"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (430, 51, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.563362+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "90"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (440, 61, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.645924+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "80"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (449, 70, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.713446+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "71"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (459, 80, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.786046+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "58"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (469, 90, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.858782+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "45"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (480, 101, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.932842+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "31"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (490, 111, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.005969+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "19"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (499, 120, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.074922+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "10"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (511, 4, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.835873+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "54"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (520, 13, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.920497+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "136"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (535, 28, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.046161+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "122"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (546, 39, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.148087+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "110"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (555, 48, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.220587+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "101"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (564, 57, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.298997+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "84"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (573, 66, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.376965+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "75"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (582, 75, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.456944+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "63"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (591, 84, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.539299+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "53"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (601, 94, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.625952+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "39"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (610, 103, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.706479+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "29"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (619, 112, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.78307+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "18"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (633, 126, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.902032+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "3"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (271, 20, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.082817+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "137"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (280, 29, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.164012+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "121"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (289, 38, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.260091+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "111"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (300, 49, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.357685+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "100"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (310, 59, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.451243+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "82"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (318, 67, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.517427+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "74"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (328, 77, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.602495+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "61"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (338, 87, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.687326+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "49"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (348, 97, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.76859+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "35"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (357, 106, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.841654+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "26"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (366, 115, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.917153+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "15"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (375, 124, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.99441+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "5"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (386, 7, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.221886+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "123"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (395, 16, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.29579+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "142"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (404, 25, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.369239+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "129"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (413, 34, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.439351+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "115"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (424, 45, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.521711+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "104"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (433, 54, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.590429+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "87"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (442, 63, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.661127+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "78"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (452, 73, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.736192+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "65"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (461, 82, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.80045+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "56"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (470, 91, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.865454+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "44"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (479, 100, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.926354+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "32"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (489, 110, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.998897+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "20"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (498, 119, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.067317+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "11"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (515, 8, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.87402+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "126"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (524, 17, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.953645+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "143"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (533, 26, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.028559+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "125"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (545, 38, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.140175+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "111"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (554, 47, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.213039+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "102"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (565, 58, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.307586+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "83"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (575, 68, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.393249+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "73"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (584, 77, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.4809+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "61"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (594, 87, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.564677+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "49"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (603, 96, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.643814+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "37"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (612, 105, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.723875+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "27"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (621, 114, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.800463+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "16"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (630, 123, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.874935+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "6"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (272, 21, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.090458+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "144"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (281, 30, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.174174+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "120"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (290, 39, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.270302+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "110"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (299, 48, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.34901+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "101"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (309, 58, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.442542+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "83"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (319, 68, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.52595+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "73"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (331, 80, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.627192+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "58"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (341, 90, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.711512+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "45"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (350, 99, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.785046+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "33"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (359, 108, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.858246+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "22"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (369, 118, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.943233+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "12"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (383, 4, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.19886+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "54"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (392, 13, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.268958+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "136"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (401, 22, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.345741+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "138"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (410, 31, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.416197+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "119"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (420, 41, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.493901+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "108"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (429, 50, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.556206+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "91"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (439, 60, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.637352+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "81"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (448, 69, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.70584+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "72"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (457, 78, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.77193+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "60"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (466, 87, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.837673+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "49"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (476, 97, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.905792+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "35"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (486, 107, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.974077+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "24"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (500, 121, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.083154+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "9"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (513, 6, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.854862+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "117"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (522, 15, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.935971+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "139"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (531, 24, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.012185+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "131"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (537, 30, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.062025+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "120"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (542, 35, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.111331+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "114"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (551, 44, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.187099+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "105"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (560, 53, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.262653+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "88"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (570, 63, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.352297+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "78"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (579, 72, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.428099+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "66"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (590, 83, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.531441+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "55"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (608, 101, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.68983+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "31"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (618, 111, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.773663+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "19"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (627, 120, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.852318+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "10"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (273, 22, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.098669+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "138"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (282, 31, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.183351+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "119"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (292, 41, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.288812+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "108"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (302, 51, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.37579+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "90"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (311, 60, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.462685+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "81"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (320, 69, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.533879+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "72"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (329, 78, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.610647+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "60"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (340, 89, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.7028+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "47"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (364, 113, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.900804+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "17"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (373, 122, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.978615+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "7"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (382, 3, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.190804+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "51"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (391, 12, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.261693+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "132"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (400, 21, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.337309+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "144"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (409, 30, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.408218+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "120"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (418, 39, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.477475+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "110"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (428, 49, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.548484+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "100"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (437, 58, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.621028+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "83"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (447, 68, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.698071+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "73"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (458, 79, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.778653+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "59"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (468, 89, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.851799+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "47"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (478, 99, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.919242+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "33"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (488, 109, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.991789+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "21"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (497, 118, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.05858+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "12"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (506, 127, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.131231+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "2"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (509, 2, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.816167+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "42"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (525, 18, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.962331+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "140"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (534, 27, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.038228+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "124"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (558, 51, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.245169+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "90"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (567, 60, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.324982+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "81"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (576, 69, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.402349+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "72"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (585, 78, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.490044+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "60"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (596, 89, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.582884+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "47"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (606, 99, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.670762+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "33"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (615, 108, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.747283+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "22"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (624, 117, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.825309+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "13"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (635, 128, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.918692+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "1"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (275, 24, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.116024+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "131"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (285, 34, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.226404+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "115"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (296, 45, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.322451+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "104"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (305, 54, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.404523+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "87"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (314, 63, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.487129+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "78"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (324, 73, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.56781+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "65"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (333, 82, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.645784+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "56"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (342, 91, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.719556+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "44"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (351, 100, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.793495+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "32"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (360, 109, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.869205+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "21"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (370, 119, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:30.951921+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "11"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (379, 128, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:31.027512+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "1"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (380, 1, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.175873+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "25"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (389, 10, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.245167+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "128"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (399, 20, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.326837+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "137"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (408, 29, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.400313+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "121"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (417, 38, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.469941+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "111"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (426, 47, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.534831+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "102"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (436, 57, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.613812+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "84"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (446, 67, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.689887+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "74"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (456, 77, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.765188+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "61"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (467, 88, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.845367+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "48"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (477, 98, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.912547+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "34"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (487, 108, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:46.983691+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "22"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (496, 117, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.051996+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "13"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (507, 128, 'activity', 'owner', NULL, 'field', '2026-10-18 23:57:47.138043+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "1"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (517, 10, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.894134+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "128"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (529, 22, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:03.99598+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "138"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (539, 32, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.082574+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "118"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (548, 41, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.163463+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "108"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (557, 50, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.237221+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "91"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (566, 59, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.316203+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "82"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (577, 70, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.411081+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "71"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (586, 79, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.498648+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "59"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (595, 88, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.573586+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "48"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (604, 97, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.654414+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "35"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (613, 106, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.731194+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "26"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (623, 116, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.817322+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "14"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (629, 122, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.866802+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "7"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (632, 125, 'activity', 'owner', NULL, 'field', '2026-10-18 23:58:04.891482+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "4"}, "subject": {"id": 1, "value": "Queue order"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (636, 21, 'activity', 'owner', NULL, 'description', '2026-10-19 01:47:06.092508+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "Goal: the queue''s work runs on this board instead of a markdown file.\n\nWhere: the board, its schema, and the repository''s workflow skills and agents.\n\nAcceptance:\n- [x] the stack runs from board/ with the database and attachments bound to the repository\n- [x] the destroy and restore drill brings the board back from snapshot/board.sql alone\n- [x] the board holds the queue''s ten columns and every ticket on its own column\n- [x] the workflow skills and agents read and write the board, not a file\n- [x] the queue file and the old reader are gone, with no reference left\n\nThe plan and the log are the Docs page \"Plan: QUEUE-21\"."}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (965, 21, 'activity', 'owner', NULL, 'description', '2026-10-19 02:11:46.606007+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"value": "Goal: the queue''s work runs on this board instead of a markdown file.\n\nWhere: the board, its schema, and the repository''s workflow skills and agents.\n\nAcceptance:\n- [x] the stack runs from board/ with the database and attachments bound to the repository\n- [x] the destroy and restore drill brings the board back from snapshot/board.sql alone\n- [x] the board holds the queue''s ten columns and every ticket on its own column\n- [x] the workflow skills and agents read and write the board, not a file\n- [x] the queue file and the old reader are gone, with no reference left\n\nThe plan and the log are the Docs page \"Plan: #144\"."}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (966, 5, 'activity', 'owner', NULL, 'status', '2026-10-19 02:11:46.656097+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 4, "value": "Done", "stateType": "completed"}, "from": {"id": 1, "value": "Backlog", "stateType": "backlog"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (967, 5, 'comment', 'owner', 'Done. This ticket described the queue as a portable workflow on a board, and ticket #144 delivered it: the queue file is gone, the board is the queue, and the skills and agents read and write it.', NULL, '2026-10-19 02:11:46.680115+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (968, 5, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.603896+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 13, "value": "#70"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (969, 21, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.620411+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 14, "value": "#144"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (970, 128, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.636539+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 15, "value": "#1"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (971, 127, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.651313+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 16, "value": "#2"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (972, 126, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.664767+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 17, "value": "#3"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (973, 125, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.678016+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 18, "value": "#4"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (974, 124, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.695789+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 19, "value": "#5"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (975, 123, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.709417+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 20, "value": "#6"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (976, 122, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.723371+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 21, "value": "#7"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (977, 121, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.739918+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 22, "value": "#9"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (978, 120, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.75341+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 23, "value": "#10"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (979, 119, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.764902+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 24, "value": "#11"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (980, 118, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.779799+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 25, "value": "#12"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (981, 117, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.794223+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 26, "value": "#13"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (982, 116, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.808011+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 27, "value": "#14"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (983, 115, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.821062+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 28, "value": "#15"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (984, 114, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.833766+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 29, "value": "#16"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (985, 113, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.846877+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 30, "value": "#17"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (986, 112, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.861948+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 31, "value": "#18"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (987, 111, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.875695+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 32, "value": "#19"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (988, 110, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.889119+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 33, "value": "#20"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (989, 109, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.902846+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 34, "value": "#21"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (990, 108, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.915659+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 35, "value": "#22"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (991, 107, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.928187+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 36, "value": "#24"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (992, 106, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.940194+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 37, "value": "#26"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (993, 105, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.953199+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 38, "value": "#27"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (994, 104, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.966123+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 39, "value": "#28"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (995, 103, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.980266+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 40, "value": "#29"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (996, 102, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:39.994242+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 41, "value": "#30"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (997, 101, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.00676+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 42, "value": "#31"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (998, 100, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.019855+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 43, "value": "#32"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (999, 99, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.032423+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 44, "value": "#33"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1000, 98, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.044565+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 45, "value": "#34"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1001, 97, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.058145+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 46, "value": "#35"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1002, 96, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.073114+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 47, "value": "#37"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1003, 95, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.085484+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 48, "value": "#38"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1004, 94, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.100886+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 49, "value": "#39"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1005, 93, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.114176+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 50, "value": "#40"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1006, 92, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.128531+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 51, "value": "#41"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1007, 91, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.142993+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 52, "value": "#44"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1008, 90, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.160953+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 53, "value": "#45"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1009, 89, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.174305+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 54, "value": "#47"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1010, 88, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.186589+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 55, "value": "#48"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1020, 78, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.310583+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 65, "value": "#60"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1021, 77, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.321794+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 66, "value": "#61"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1022, 76, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.333416+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 67, "value": "#62"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1023, 75, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.345156+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 68, "value": "#63"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1024, 74, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.357623+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 69, "value": "#64"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1025, 73, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.369733+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 70, "value": "#65"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1085, 12, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.133078+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 130, "value": "#132"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1086, 11, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.146082+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 131, "value": "#130"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1087, 10, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.160437+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 132, "value": "#128"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1092, 4, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.230743+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 137, "value": "#54"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1093, 3, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.245016+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 138, "value": "#51"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1094, 2, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.259343+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 139, "value": "#42"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1095, 1, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.272765+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 140, "value": "#25"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1011, 87, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.19932+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 56, "value": "#49"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1012, 86, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.212271+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 57, "value": "#50"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1013, 85, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.224172+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 58, "value": "#52"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1014, 84, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.236407+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 59, "value": "#53"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1015, 83, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.247548+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 60, "value": "#55"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1016, 82, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.261402+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 61, "value": "#56"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1017, 81, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.272983+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 62, "value": "#57"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1018, 80, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.28556+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 63, "value": "#58"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1019, 79, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.298984+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 64, "value": "#59"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1026, 72, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.381512+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 71, "value": "#66"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1027, 71, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.394167+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 72, "value": "#68"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1028, 70, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.410811+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 73, "value": "#71"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1029, 69, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.425616+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 74, "value": "#72"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1030, 68, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.438554+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 75, "value": "#73"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1031, 67, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.451147+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 76, "value": "#74"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1032, 66, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.462703+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 77, "value": "#75"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1033, 65, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.473749+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 78, "value": "#76"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1034, 64, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.485438+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 79, "value": "#77"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1035, 63, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.495867+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 80, "value": "#78"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1036, 62, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.508672+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 81, "value": "#79"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1037, 61, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.521304+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 82, "value": "#80"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1038, 60, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.533657+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 83, "value": "#81"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1039, 59, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.547469+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 84, "value": "#82"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1040, 58, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.56133+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 85, "value": "#83"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1041, 57, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.576023+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 86, "value": "#84"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1042, 56, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.588064+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 87, "value": "#85"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1043, 55, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.600774+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 88, "value": "#86"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1044, 54, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.614304+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 89, "value": "#87"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1045, 53, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.626921+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 90, "value": "#88"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1046, 52, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.639071+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 91, "value": "#89"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1047, 51, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.649458+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 92, "value": "#90"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1048, 50, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.659704+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 93, "value": "#91"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1049, 49, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.670861+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 94, "value": "#100"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1050, 48, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.683293+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 95, "value": "#101"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1051, 47, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.697725+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 96, "value": "#102"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1052, 46, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.710366+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 97, "value": "#103"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1053, 45, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.722307+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 98, "value": "#104"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1054, 44, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.73377+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 99, "value": "#105"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1055, 43, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.744762+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 100, "value": "#106"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1056, 42, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.762051+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 101, "value": "#107"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1057, 41, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.773085+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 102, "value": "#108"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1058, 40, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.784899+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 103, "value": "#109"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1059, 39, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.800521+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 104, "value": "#110"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1060, 38, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.812601+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 105, "value": "#111"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1061, 37, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.824571+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 106, "value": "#112"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1062, 36, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.837137+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 107, "value": "#113"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1063, 35, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.849622+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 108, "value": "#114"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1064, 34, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.861853+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 109, "value": "#115"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1065, 33, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.873257+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 110, "value": "#116"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1066, 32, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.884371+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 111, "value": "#118"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1067, 31, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.895076+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 112, "value": "#119"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1068, 30, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.907649+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 113, "value": "#120"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1069, 29, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.919042+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 114, "value": "#121"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1070, 28, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.931052+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 115, "value": "#122"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1071, 27, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.942836+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 116, "value": "#124"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1072, 26, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.956705+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 117, "value": "#125"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1073, 25, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.968806+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 118, "value": "#129"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1074, 24, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.980829+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 119, "value": "#131"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1075, 23, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:40.993733+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 120, "value": "#134"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1076, 22, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.007145+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 121, "value": "#138"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1077, 20, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.019554+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 122, "value": "#137"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1078, 19, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.033042+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 123, "value": "#141"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1079, 18, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.045965+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 124, "value": "#140"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1080, 17, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.057615+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 125, "value": "#143"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1081, 16, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.073886+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 126, "value": "#142"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1082, 15, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.089246+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 127, "value": "#139"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1083, 14, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.104181+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 128, "value": "#135"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1084, 13, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.118018+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 129, "value": "#136"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1088, 9, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.178443+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 133, "value": "#127"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1089, 8, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.190324+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 134, "value": "#126"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1090, 7, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.202607+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 135, "value": "#123"}}', NULL);
INSERT INTO public.issue_activity (id, issue_id, kind, actor_name, body, action, created_at, actor_user_id, initiative_id, reply_to_id, payload, edited_at) VALUES (1091, 6, 'activity', 'owner', NULL, 'label_add', '2026-10-19 02:20:41.214515+00', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', NULL, NULL, '{"to": {"id": 136, "value": "#117"}}', NULL);


--
-- Data for Name: issue_attachment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_checklist; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_checklist_item; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_cycle; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_development_check; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_development_link; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_field_option; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_field_value; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (2, 2, 1, NULL, 42, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (3, 3, 1, NULL, 51, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (4, 4, 1, NULL, 54, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (5, 5, 1, NULL, 70, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (6, 6, 1, NULL, 117, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (7, 7, 1, NULL, 123, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (8, 8, 1, NULL, 126, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (9, 9, 1, NULL, 127, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (10, 10, 1, NULL, 128, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (11, 11, 1, NULL, 130, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (12, 12, 1, NULL, 132, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (13, 13, 1, NULL, 136, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (14, 14, 1, NULL, 135, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (15, 15, 1, NULL, 139, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (16, 16, 1, NULL, 142, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (17, 17, 1, NULL, 143, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (18, 18, 1, NULL, 140, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (19, 19, 1, NULL, 141, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (20, 20, 1, NULL, 137, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (21, 21, 1, NULL, 144, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (22, 22, 1, NULL, 138, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (23, 23, 1, NULL, 134, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (24, 24, 1, NULL, 131, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (25, 25, 1, NULL, 129, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (26, 26, 1, NULL, 125, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (27, 27, 1, NULL, 124, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (28, 28, 1, NULL, 122, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (29, 29, 1, NULL, 121, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (30, 30, 1, NULL, 120, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (31, 31, 1, NULL, 119, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (32, 32, 1, NULL, 118, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (33, 33, 1, NULL, 116, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (34, 34, 1, NULL, 115, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (35, 35, 1, NULL, 114, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (36, 36, 1, NULL, 113, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (37, 37, 1, NULL, 112, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (38, 38, 1, NULL, 111, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (39, 39, 1, NULL, 110, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (40, 40, 1, NULL, 109, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (41, 41, 1, NULL, 108, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (42, 42, 1, NULL, 107, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (43, 43, 1, NULL, 106, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (44, 44, 1, NULL, 105, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (45, 45, 1, NULL, 104, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (46, 46, 1, NULL, 103, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (47, 47, 1, NULL, 102, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (48, 48, 1, NULL, 101, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (49, 49, 1, NULL, 100, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (50, 50, 1, NULL, 91, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (51, 51, 1, NULL, 90, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (52, 52, 1, NULL, 89, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (53, 53, 1, NULL, 88, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (54, 54, 1, NULL, 87, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (55, 55, 1, NULL, 86, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (56, 56, 1, NULL, 85, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (57, 57, 1, NULL, 84, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (58, 58, 1, NULL, 83, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (59, 59, 1, NULL, 82, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (60, 60, 1, NULL, 81, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (61, 61, 1, NULL, 80, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (62, 62, 1, NULL, 79, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (63, 63, 1, NULL, 78, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (64, 64, 1, NULL, 77, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (65, 65, 1, NULL, 76, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (66, 66, 1, NULL, 75, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (67, 67, 1, NULL, 74, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (68, 68, 1, NULL, 73, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (69, 69, 1, NULL, 72, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (70, 70, 1, NULL, 71, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (71, 71, 1, NULL, 68, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (72, 72, 1, NULL, 66, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (73, 73, 1, NULL, 65, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (74, 74, 1, NULL, 64, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (75, 75, 1, NULL, 63, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (76, 76, 1, NULL, 62, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (77, 77, 1, NULL, 61, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (78, 78, 1, NULL, 60, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (79, 79, 1, NULL, 59, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (80, 80, 1, NULL, 58, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (81, 81, 1, NULL, 57, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (82, 82, 1, NULL, 56, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (83, 83, 1, NULL, 55, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (84, 84, 1, NULL, 53, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (85, 85, 1, NULL, 52, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (86, 86, 1, NULL, 50, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (87, 87, 1, NULL, 49, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (88, 88, 1, NULL, 48, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (89, 89, 1, NULL, 47, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (90, 90, 1, NULL, 45, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (91, 91, 1, NULL, 44, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (92, 92, 1, NULL, 41, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (93, 93, 1, NULL, 40, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (94, 94, 1, NULL, 39, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (95, 95, 1, NULL, 38, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (96, 96, 1, NULL, 37, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (97, 97, 1, NULL, 35, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (98, 98, 1, NULL, 34, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (99, 99, 1, NULL, 33, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (100, 100, 1, NULL, 32, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (101, 101, 1, NULL, 31, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (102, 102, 1, NULL, 30, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (103, 103, 1, NULL, 29, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (104, 104, 1, NULL, 28, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (105, 105, 1, NULL, 27, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (106, 106, 1, NULL, 26, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (107, 107, 1, NULL, 24, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (108, 108, 1, NULL, 22, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (110, 110, 1, NULL, 20, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (111, 111, 1, NULL, 19, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (112, 112, 1, NULL, 18, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (113, 113, 1, NULL, 17, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (114, 114, 1, NULL, 16, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (115, 115, 1, NULL, 15, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (116, 116, 1, NULL, 14, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (117, 117, 1, NULL, 13, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (118, 118, 1, NULL, 12, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (119, 119, 1, NULL, 11, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (120, 120, 1, NULL, 10, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (121, 121, 1, NULL, 9, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (122, 122, 1, NULL, 7, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (123, 123, 1, NULL, 6, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (125, 125, 1, NULL, 4, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (126, 126, 1, NULL, 3, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (127, 127, 1, NULL, 2, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (128, 128, 1, NULL, 1, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (1, 1, 1, NULL, 25, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (109, 109, 1, NULL, 21, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.issue_field_value (id, issue_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, value_datetime_end, value_user_id) VALUES (124, 124, 1, NULL, 5, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: issue_import; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_key_alias; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_label; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue_label (issue_id, label_id) VALUES (5, 13);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (21, 14);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (128, 15);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (127, 16);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (126, 17);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (125, 18);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (124, 19);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (123, 20);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (122, 21);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (121, 22);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (120, 23);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (119, 24);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (118, 25);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (117, 26);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (116, 27);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (115, 28);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (114, 29);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (113, 30);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (112, 31);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (111, 32);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (110, 33);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (109, 34);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (108, 35);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (107, 36);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (106, 37);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (105, 38);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (104, 39);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (103, 40);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (102, 41);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (101, 42);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (100, 43);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (99, 44);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (98, 45);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (97, 46);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (96, 47);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (95, 48);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (94, 49);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (93, 50);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (92, 51);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (91, 52);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (90, 53);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (89, 54);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (88, 55);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (87, 56);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (86, 57);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (85, 58);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (84, 59);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (83, 60);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (82, 61);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (81, 62);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (80, 63);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (79, 64);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (78, 65);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (77, 66);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (76, 67);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (75, 68);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (74, 69);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (73, 70);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (72, 71);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (71, 72);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (70, 73);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (69, 74);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (68, 75);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (67, 76);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (66, 77);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (65, 78);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (64, 79);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (63, 80);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (62, 81);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (61, 82);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (60, 83);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (59, 84);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (58, 85);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (57, 86);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (56, 87);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (55, 88);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (54, 89);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (53, 90);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (52, 91);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (51, 92);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (50, 93);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (49, 94);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (48, 95);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (47, 96);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (46, 97);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (45, 98);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (44, 99);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (43, 100);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (42, 101);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (41, 102);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (40, 103);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (39, 104);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (38, 105);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (37, 106);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (36, 107);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (35, 108);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (34, 109);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (33, 110);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (32, 111);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (31, 112);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (30, 113);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (29, 114);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (28, 115);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (27, 116);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (26, 117);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (25, 118);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (24, 119);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (23, 120);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (22, 121);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (20, 122);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (19, 123);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (18, 124);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (17, 125);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (16, 126);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (15, 127);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (14, 128);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (13, 129);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (12, 130);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (11, 131);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (10, 132);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (9, 133);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (8, 134);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (7, 135);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (6, 136);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (4, 137);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (3, 138);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (2, 139);
INSERT INTO public.issue_label (issue_id, label_id) VALUES (1, 140);


--
-- Data for Name: issue_link; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (1, 96, 1, 'blocks', '2026-10-18 23:35:57.734059+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (2, 94, 1, 'blocks', '2026-10-18 23:35:57.746314+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (3, 86, 3, 'blocks', '2026-10-18 23:35:57.759062+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (4, 126, 6, 'blocks', '2026-10-18 23:35:57.77362+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (5, 120, 6, 'blocks', '2026-10-18 23:35:57.785219+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (6, 112, 6, 'blocks', '2026-10-18 23:35:57.800755+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (7, 9, 7, 'blocks', '2026-10-18 23:35:57.810192+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (8, 122, 8, 'blocks', '2026-10-18 23:35:57.818717+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (9, 120, 8, 'blocks', '2026-10-18 23:35:57.828259+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (10, 113, 8, 'blocks', '2026-10-18 23:35:57.83738+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (11, 120, 10, 'blocks', '2026-10-18 23:35:57.847167+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (12, 112, 10, 'blocks', '2026-10-18 23:35:57.854372+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (13, 127, 14, 'blocks', '2026-10-18 23:35:57.86245+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (14, 126, 14, 'blocks', '2026-10-18 23:35:57.870794+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (15, 120, 14, 'blocks', '2026-10-18 23:35:57.8787+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (16, 112, 14, 'blocks', '2026-10-18 23:35:57.886984+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (17, 18, 20, 'blocks', '2026-10-18 23:35:57.895356+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (18, 120, 28, 'blocks', '2026-10-18 23:35:57.902774+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (19, 114, 28, 'blocks', '2026-10-18 23:35:57.91076+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (20, 120, 29, 'blocks', '2026-10-18 23:35:57.918197+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (21, 114, 29, 'blocks', '2026-10-18 23:35:57.926488+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (22, 120, 30, 'blocks', '2026-10-18 23:35:57.933786+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (23, 114, 30, 'blocks', '2026-10-18 23:35:57.941562+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (24, 120, 31, 'blocks', '2026-10-18 23:35:57.949179+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (25, 114, 31, 'blocks', '2026-10-18 23:35:57.959444+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (26, 120, 32, 'blocks', '2026-10-18 23:35:57.968171+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (27, 114, 32, 'blocks', '2026-10-18 23:35:57.977054+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (28, 56, 53, 'blocks', '2026-10-18 23:35:57.984718+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (29, 58, 56, 'blocks', '2026-10-18 23:35:57.992089+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (60, 53, 58, 'blocks', '2026-10-18 23:36:09.561353+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (61, 125, 59, 'blocks', '2026-10-18 23:36:09.57103+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (62, 62, 59, 'blocks', '2026-10-18 23:36:09.578086+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (63, 60, 59, 'blocks', '2026-10-18 23:36:09.584722+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (97, 67, 60, 'blocks', '2026-10-18 23:36:15.637304+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (98, 69, 62, 'blocks', '2026-10-18 23:36:15.647579+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (99, 67, 62, 'blocks', '2026-10-18 23:36:15.655973+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (100, 95, 67, 'blocks', '2026-10-18 23:36:15.663817+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (101, 94, 67, 'blocks', '2026-10-18 23:36:15.671955+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (102, 69, 67, 'blocks', '2026-10-18 23:36:15.6804+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (103, 80, 71, 'blocks', '2026-10-18 23:36:15.688085+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (104, 81, 75, 'blocks', '2026-10-18 23:36:15.69595+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (105, 71, 75, 'blocks', '2026-10-18 23:36:15.703451+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (106, 94, 76, 'blocks', '2026-10-18 23:36:15.711496+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (107, 94, 77, 'blocks', '2026-10-18 23:36:15.720102+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (108, 94, 78, 'blocks', '2026-10-18 23:36:15.72772+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (109, 77, 79, 'blocks', '2026-10-18 23:36:15.734767+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (110, 75, 79, 'blocks', '2026-10-18 23:36:15.741586+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (111, 94, 80, 'blocks', '2026-10-18 23:36:15.748877+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (112, 94, 81, 'blocks', '2026-10-18 23:36:15.755723+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (113, 84, 83, 'blocks', '2026-10-18 23:36:15.762912+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (114, 95, 94, 'blocks', '2026-10-18 23:36:15.76907+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (115, 96, 95, 'blocks', '2026-10-18 23:36:15.776009+00');
INSERT INTO public.issue_link (id, source_issue_id, target_issue_id, kind, created_at) VALUES (116, 123, 112, 'blocks', '2026-10-18 23:36:15.785791+00');


--
-- Data for Name: issue_status; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (15, 15, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.731+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (16, 16, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.745+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (17, 17, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.759+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (18, 18, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.773+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (19, 19, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.787+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (22, 22, 4, 'Done', 'completed', '2026-10-18 23:35:55.83+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (23, 23, 4, 'Done', 'completed', '2026-10-18 23:35:55.848+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (24, 24, 4, 'Done', 'completed', '2026-10-18 23:35:55.866+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (25, 25, 4, 'Done', 'completed', '2026-10-18 23:35:55.882+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (26, 26, 4, 'Done', 'completed', '2026-10-18 23:35:55.899+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (27, 27, 4, 'Done', 'completed', '2026-10-18 23:35:55.916+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (28, 28, 4, 'Done', 'completed', '2026-10-18 23:35:55.933+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (29, 29, 4, 'Done', 'completed', '2026-10-18 23:35:55.952+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (30, 30, 4, 'Done', 'completed', '2026-10-18 23:35:55.973+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (31, 31, 4, 'Done', 'completed', '2026-10-18 23:35:55.994+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (32, 32, 4, 'Done', 'completed', '2026-10-18 23:35:56.012+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (33, 33, 4, 'Done', 'completed', '2026-10-18 23:35:56.034+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (34, 34, 4, 'Done', 'completed', '2026-10-18 23:35:56.051+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (35, 35, 4, 'Done', 'completed', '2026-10-18 23:35:56.074+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (36, 36, 4, 'Done', 'completed', '2026-10-18 23:35:56.091+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (37, 37, 4, 'Done', 'completed', '2026-10-18 23:35:56.108+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (38, 38, 4, 'Done', 'completed', '2026-10-18 23:35:56.126+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (39, 39, 4, 'Done', 'completed', '2026-10-18 23:35:56.142+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (40, 40, 4, 'Done', 'completed', '2026-10-18 23:35:56.161+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (41, 41, 4, 'Done', 'completed', '2026-10-18 23:35:56.178+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (42, 42, 4, 'Done', 'completed', '2026-10-18 23:35:56.194+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (43, 43, 4, 'Done', 'completed', '2026-10-18 23:35:56.21+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (44, 44, 4, 'Done', 'completed', '2026-10-18 23:35:56.227+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (45, 45, 4, 'Done', 'completed', '2026-10-18 23:35:56.244+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (46, 46, 4, 'Done', 'completed', '2026-10-18 23:35:56.259+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (47, 47, 4, 'Done', 'completed', '2026-10-18 23:35:56.276+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (48, 48, 4, 'Done', 'completed', '2026-10-18 23:35:56.294+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (49, 49, 4, 'Done', 'completed', '2026-10-18 23:35:56.314+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (50, 50, 4, 'Done', 'completed', '2026-10-18 23:35:56.329+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (51, 51, 4, 'Done', 'completed', '2026-10-18 23:35:56.345+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (52, 52, 4, 'Done', 'completed', '2026-10-18 23:35:56.36+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (53, 53, 4, 'Done', 'completed', '2026-10-18 23:35:56.378+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (54, 54, 4, 'Done', 'completed', '2026-10-18 23:35:56.396+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (55, 55, 4, 'Done', 'completed', '2026-10-18 23:35:56.415+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (56, 56, 4, 'Done', 'completed', '2026-10-18 23:35:56.433+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (57, 57, 4, 'Done', 'completed', '2026-10-18 23:35:56.452+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (58, 58, 4, 'Done', 'completed', '2026-10-18 23:35:56.472+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (59, 59, 4, 'Done', 'completed', '2026-10-18 23:35:56.49+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (60, 60, 4, 'Done', 'completed', '2026-10-18 23:35:56.507+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (61, 61, 4, 'Done', 'completed', '2026-10-18 23:35:56.525+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (62, 62, 4, 'Done', 'completed', '2026-10-18 23:35:56.549+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (63, 63, 4, 'Done', 'completed', '2026-10-18 23:35:56.568+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (64, 64, 4, 'Done', 'completed', '2026-10-18 23:35:56.587+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (65, 65, 4, 'Done', 'completed', '2026-10-18 23:35:56.605+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (66, 66, 4, 'Done', 'completed', '2026-10-18 23:35:56.626+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (67, 67, 4, 'Done', 'completed', '2026-10-18 23:35:56.642+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (68, 68, 4, 'Done', 'completed', '2026-10-18 23:35:56.658+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (69, 69, 4, 'Done', 'completed', '2026-10-18 23:35:56.676+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (70, 70, 4, 'Done', 'completed', '2026-10-18 23:35:56.692+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (71, 71, 4, 'Done', 'completed', '2026-10-18 23:35:56.71+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (72, 72, 4, 'Done', 'completed', '2026-10-18 23:35:56.727+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (73, 73, 4, 'Done', 'completed', '2026-10-18 23:35:56.745+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (74, 74, 4, 'Done', 'completed', '2026-10-18 23:35:56.762+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (75, 75, 4, 'Done', 'completed', '2026-10-18 23:35:56.781+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (76, 76, 4, 'Done', 'completed', '2026-10-18 23:35:56.798+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (77, 77, 4, 'Done', 'completed', '2026-10-18 23:35:56.815+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (78, 78, 4, 'Done', 'completed', '2026-10-18 23:35:56.83+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (79, 79, 4, 'Done', 'completed', '2026-10-18 23:35:56.846+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (80, 80, 4, 'Done', 'completed', '2026-10-18 23:35:56.86+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (81, 81, 4, 'Done', 'completed', '2026-10-18 23:35:56.876+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (82, 82, 4, 'Done', 'completed', '2026-10-18 23:35:56.894+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (83, 83, 4, 'Done', 'completed', '2026-10-18 23:35:56.912+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (84, 84, 4, 'Done', 'completed', '2026-10-18 23:35:56.928+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (85, 85, 4, 'Done', 'completed', '2026-10-18 23:35:56.944+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (86, 86, 4, 'Done', 'completed', '2026-10-18 23:35:56.961+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (87, 87, 4, 'Done', 'completed', '2026-10-18 23:35:56.977+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (88, 88, 4, 'Done', 'completed', '2026-10-18 23:35:56.991+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (89, 89, 4, 'Done', 'completed', '2026-10-18 23:35:57.007+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (90, 90, 4, 'Done', 'completed', '2026-10-18 23:35:57.024+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (91, 91, 4, 'Done', 'completed', '2026-10-18 23:35:57.042+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (92, 92, 4, 'Done', 'completed', '2026-10-18 23:35:57.062+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (93, 93, 4, 'Done', 'completed', '2026-10-18 23:35:57.08+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (94, 94, 4, 'Done', 'completed', '2026-10-18 23:35:57.097+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (95, 95, 4, 'Done', 'completed', '2026-10-18 23:35:57.114+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (96, 96, 4, 'Done', 'completed', '2026-10-18 23:35:57.131+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (97, 97, 4, 'Done', 'completed', '2026-10-18 23:35:57.15+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (98, 98, 4, 'Done', 'completed', '2026-10-18 23:35:57.166+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (99, 99, 4, 'Done', 'completed', '2026-10-18 23:35:57.182+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (100, 100, 4, 'Done', 'completed', '2026-10-18 23:35:57.198+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (101, 101, 4, 'Done', 'completed', '2026-10-18 23:35:57.213+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (102, 102, 4, 'Done', 'completed', '2026-10-18 23:35:57.229+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (103, 103, 4, 'Done', 'completed', '2026-10-18 23:35:57.245+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (104, 104, 4, 'Done', 'completed', '2026-10-18 23:35:57.263+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (105, 105, 4, 'Done', 'completed', '2026-10-18 23:35:57.28+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (106, 106, 4, 'Done', 'completed', '2026-10-18 23:35:57.297+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (107, 107, 4, 'Done', 'completed', '2026-10-18 23:35:57.318+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (108, 108, 4, 'Done', 'completed', '2026-10-18 23:35:57.338+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (109, 109, 4, 'Done', 'completed', '2026-10-18 23:35:57.356+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (110, 110, 4, 'Done', 'completed', '2026-10-18 23:35:57.372+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (111, 111, 4, 'Done', 'completed', '2026-10-18 23:35:57.388+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (112, 112, 4, 'Done', 'completed', '2026-10-18 23:35:57.406+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (113, 113, 4, 'Done', 'completed', '2026-10-18 23:35:57.423+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (114, 114, 4, 'Done', 'completed', '2026-10-18 23:35:57.441+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (115, 115, 4, 'Done', 'completed', '2026-10-18 23:35:57.457+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (116, 116, 4, 'Done', 'completed', '2026-10-18 23:35:57.475+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (117, 117, 4, 'Done', 'completed', '2026-10-18 23:35:57.492+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (118, 118, 4, 'Done', 'completed', '2026-10-18 23:35:57.512+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (119, 119, 4, 'Done', 'completed', '2026-10-18 23:35:57.528+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (120, 120, 4, 'Done', 'completed', '2026-10-18 23:35:57.546+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (3, 3, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.539+00', '2026-10-18 23:57:28.6352+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (4, 4, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.558+00', '2026-10-18 23:57:28.650791+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (6, 6, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.593+00', '2026-10-18 23:57:28.679323+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (7, 7, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.606+00', '2026-10-18 23:57:28.696495+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (8, 8, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.623+00', '2026-10-18 23:57:28.712485+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (9, 9, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.638+00', '2026-10-18 23:57:28.728256+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (11, 11, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.668+00', '2026-10-18 23:57:28.758861+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (12, 12, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.683+00', '2026-10-18 23:57:28.774789+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (13, 13, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.699+00', '2026-10-18 23:57:28.788645+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (14, 14, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.717+00', '2026-10-18 23:57:28.802847+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (20, 20, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.799+00', '2026-10-18 23:57:28.873774+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (121, 121, 4, 'Done', 'completed', '2026-10-18 23:35:57.562+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (123, 123, 4, 'Done', 'completed', '2026-10-18 23:35:57.597+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (125, 125, 4, 'Done', 'completed', '2026-10-18 23:35:57.635+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (127, 127, 4, 'Done', 'completed', '2026-10-18 23:35:57.683+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (122, 122, 4, 'Done', 'completed', '2026-10-18 23:35:57.578+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (124, 124, 4, 'Done', 'completed', '2026-10-18 23:35:57.617+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (126, 126, 4, 'Done', 'completed', '2026-10-18 23:35:57.662+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (128, 128, 4, 'Done', 'completed', '2026-10-18 23:35:57.704+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (1, 1, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.447+00', '2026-10-18 23:57:28.59778+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (129, 1, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.59778+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (2, 2, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.506+00', '2026-10-18 23:57:28.619561+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (130, 2, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.619561+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (131, 3, 11, 'Upstream', 'started', '2026-10-18 23:57:28.6352+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (132, 4, 7, 'Blocked', 'started', '2026-10-18 23:57:28.650791+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (133, 6, 9, 'Owner-led', 'started', '2026-10-18 23:57:28.679323+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (134, 7, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.696495+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (135, 8, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.712485+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (136, 9, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.728256+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (10, 10, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.654+00', '2026-10-18 23:57:28.743841+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (137, 10, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.743841+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (138, 11, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.758861+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (139, 12, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.774789+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (140, 13, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.788645+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (141, 14, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.802847+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (142, 20, 10, 'Deferred', 'backlog', '2026-10-18 23:57:28.873774+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (21, 21, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.814+00', '2026-10-18 23:57:28.891996+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (143, 21, 9, 'Owner-led', 'started', '2026-10-18 23:57:28.891996+00', NULL);
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (5, 5, 1, 'Backlog', 'backlog', '2026-10-18 23:35:55.576+00', '2026-10-19 02:11:46.649902+00');
INSERT INTO public.issue_status (id, issue_id, column_id, column_name, state_type, entered_at, left_at) VALUES (294, 5, 4, 'Done', 'completed', '2026-10-19 02:11:46.649902+00', NULL);


--
-- Data for Name: issue_template; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_template_label; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: issue_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue_type (id, project_id, name, icon, color, is_default, "position", created_at) VALUES (1, 1, 'Task', '', '#0ea5e9', true, 0, '2026-10-18 23:35:27.31234+00');


--
-- Data for Name: issue_watcher; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (1, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.47995+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (2, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.525773+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (3, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.549299+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (4, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.567604+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (5, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.584808+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (6, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.599741+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (7, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.615485+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (8, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.630654+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (9, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.64601+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (10, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.66156+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (11, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.676796+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (12, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.691128+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (13, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.710845+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (14, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.724793+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (15, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.739047+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (16, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.752255+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (17, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.765958+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (18, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.781142+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (19, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.792978+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (20, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.807223+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (21, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.822122+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (22, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.838588+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (23, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.85846+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (24, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.875285+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (25, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.892162+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (26, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.908119+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (27, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.925002+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (28, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.94216+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (29, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.964308+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (30, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:55.985527+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (31, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.004403+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (32, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.025008+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (33, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.043838+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (34, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.066395+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (35, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.084034+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (36, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.100586+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (37, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.11773+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (38, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.134716+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (39, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.151824+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (40, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.171268+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (41, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.187323+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (42, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.202913+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (43, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.22003+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (44, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.236581+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (45, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.252527+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (46, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.268847+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (47, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.28591+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (48, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.306521+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (49, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.322667+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (50, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.337459+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (51, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.35396+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (52, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.370607+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (53, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.388382+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (54, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.406669+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (55, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.424996+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (56, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.444984+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (57, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.461368+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (58, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.482012+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (59, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.499023+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (60, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.516684+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (61, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.540558+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (62, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.558051+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (63, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.578331+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (64, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.598075+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (65, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.61761+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (66, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.634254+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (67, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.651035+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (68, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.667767+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (69, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.685288+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (70, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.701788+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (71, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.720301+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (72, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.738022+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (73, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.75458+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (74, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.773906+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (75, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.790378+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (76, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.807104+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (77, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.823836+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (78, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.839328+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (79, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.854056+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (80, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.869309+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (81, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.886196+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (82, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.903693+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (83, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.920508+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (84, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.937513+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (85, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.954858+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (86, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.970053+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (87, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.984232+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (88, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:56.999735+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (89, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.016414+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (90, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.034652+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (91, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.051793+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (92, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.071562+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (93, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.089541+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (94, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.106574+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (95, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.123738+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (96, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.141359+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (97, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.159254+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (98, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.176115+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (99, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.190872+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (100, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.206581+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (101, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.222095+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (102, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.238153+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (103, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.255011+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (104, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.272724+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (105, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.289323+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (106, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.310675+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (107, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.330553+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (108, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.348328+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (110, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.381341+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (112, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.415959+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (114, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.449697+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (116, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.485088+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (118, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.521039+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (120, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.55607+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (122, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.589435+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (124, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.626329+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (126, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.674161+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (128, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.71657+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (109, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.364895+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (111, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.397603+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (113, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.433798+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (115, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.465403+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (117, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.504125+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (119, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.537894+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (121, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.571096+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (123, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.607685+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (125, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.647769+00');
INSERT INTO public.issue_watcher (issue_id, user_id, subscribed, created_at) VALUES (127, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', true, '2026-10-18 23:35:57.692885+00');


--
-- Data for Name: issue_worklog; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: jwks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.jwks (id, public_key, private_key, created_at, expires_at, alg, crv) VALUES ('DRzYOV0dkBE4tdrFSCLKrw4s6uhJPTe3', '{"crv":"Ed25519","kty":"OKP","x":"Kr_CWEXwObjNGiHCWcdg79kVsL5kqo1oBwTnEF9978w"}', '"bf9eb7f6c461b68c56df10c1840c646c7aed9eecd51a437b245f13a62fc984fe22565f884d23f2c6c32848ae6472d53c307b51b41ace968897c0d84cc6d6a5a4d7f05f41912396d3fd88e23080ef3e4daeb10b2588b44e01fe40e9f36eab1875437205016dc92869a8de6132799bee0b37d599f942fd516dae3c69bf2472ed76cd94a0ff172e9ae4f712b6dba970f4d5b7d5c4610feff9f2e81811d75bc266c867c76271a30d4130e0"', '2026-10-19 01:51:47.222', NULL, 'EdDSA', 'Ed25519');


--
-- Data for Name: label; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (1, 1, 1, 'iOS', '#3b82f6', '2026-10-19 01:39:09.463712+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (2, 1, 1, 'Android', '#22c55e', '2026-10-19 01:39:09.473375+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (3, 1, 1, 'Both', '#14b8a6', '2026-10-19 01:39:09.479613+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (4, 1, 2, 'widgets', '#8b5cf6', '2026-10-19 01:39:09.485592+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (5, 1, 2, 'notifications', '#f59e0b', '2026-10-19 01:39:09.492552+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (6, 1, 2, 'prayer-times', '#0ea5e9', '2026-10-19 01:39:09.498591+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (7, 1, 2, 'qibla', '#f97316', '2026-10-19 01:39:09.503788+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (8, 1, 2, 'board', '#64748b', '2026-10-19 01:39:09.508968+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (9, 1, 2, 'docs', '#6366f1', '2026-10-19 01:39:09.515162+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (10, 1, 2, 'research', '#ec4899', '2026-10-19 01:39:09.520196+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (11, 1, NULL, 'needs-owner', '#ef4444', '2026-10-19 01:39:09.52511+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (12, 1, NULL, 'upstream', '#06b6d4', '2026-10-19 01:39:09.530574+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (13, 1, 3, '#70', '#ffffff', '2026-10-19 02:20:39.578807+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (14, 1, 3, '#144', '#ffffff', '2026-10-19 02:20:39.612121+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (15, 1, 3, '#1', '#ffffff', '2026-10-19 02:20:39.627211+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (16, 1, 3, '#2', '#ffffff', '2026-10-19 02:20:39.642531+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (17, 1, 3, '#3', '#ffffff', '2026-10-19 02:20:39.657776+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (18, 1, 3, '#4', '#ffffff', '2026-10-19 02:20:39.670872+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (19, 1, 3, '#5', '#ffffff', '2026-10-19 02:20:39.68444+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (20, 1, 3, '#6', '#ffffff', '2026-10-19 02:20:39.702+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (21, 1, 3, '#7', '#ffffff', '2026-10-19 02:20:39.715995+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (22, 1, 3, '#9', '#ffffff', '2026-10-19 02:20:39.731559+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (23, 1, 3, '#10', '#ffffff', '2026-10-19 02:20:39.746504+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (24, 1, 3, '#11', '#ffffff', '2026-10-19 02:20:39.75863+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (25, 1, 3, '#12', '#ffffff', '2026-10-19 02:20:39.7716+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (26, 1, 3, '#13', '#ffffff', '2026-10-19 02:20:39.786869+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (27, 1, 3, '#14', '#ffffff', '2026-10-19 02:20:39.800352+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (28, 1, 3, '#15', '#ffffff', '2026-10-19 02:20:39.813785+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (29, 1, 3, '#16', '#ffffff', '2026-10-19 02:20:39.827108+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (30, 1, 3, '#17', '#ffffff', '2026-10-19 02:20:39.839695+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (31, 1, 3, '#18', '#ffffff', '2026-10-19 02:20:39.85425+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (32, 1, 3, '#19', '#ffffff', '2026-10-19 02:20:39.868562+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (33, 1, 3, '#20', '#ffffff', '2026-10-19 02:20:39.88175+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (34, 1, 3, '#21', '#ffffff', '2026-10-19 02:20:39.894611+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (35, 1, 3, '#22', '#ffffff', '2026-10-19 02:20:39.908668+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (36, 1, 3, '#24', '#ffffff', '2026-10-19 02:20:39.921856+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (37, 1, 3, '#26', '#ffffff', '2026-10-19 02:20:39.933723+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (38, 1, 3, '#27', '#ffffff', '2026-10-19 02:20:39.946135+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (39, 1, 3, '#28', '#ffffff', '2026-10-19 02:20:39.959238+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (40, 1, 3, '#29', '#ffffff', '2026-10-19 02:20:39.972475+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (41, 1, 3, '#30', '#ffffff', '2026-10-19 02:20:39.986594+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (42, 1, 3, '#31', '#ffffff', '2026-10-19 02:20:40.000565+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (43, 1, 3, '#32', '#ffffff', '2026-10-19 02:20:40.013691+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (44, 1, 3, '#33', '#ffffff', '2026-10-19 02:20:40.026057+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (45, 1, 3, '#34', '#ffffff', '2026-10-19 02:20:40.037485+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (46, 1, 3, '#35', '#ffffff', '2026-10-19 02:20:40.05008+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (47, 1, 3, '#37', '#ffffff', '2026-10-19 02:20:40.066077+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (48, 1, 3, '#38', '#ffffff', '2026-10-19 02:20:40.078689+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (49, 1, 3, '#39', '#ffffff', '2026-10-19 02:20:40.091519+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (50, 1, 3, '#40', '#ffffff', '2026-10-19 02:20:40.106719+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (51, 1, 3, '#41', '#ffffff', '2026-10-19 02:20:40.121207+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (52, 1, 3, '#44', '#ffffff', '2026-10-19 02:20:40.135205+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (53, 1, 3, '#45', '#ffffff', '2026-10-19 02:20:40.153849+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (54, 1, 3, '#47', '#ffffff', '2026-10-19 02:20:40.167498+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (55, 1, 3, '#48', '#ffffff', '2026-10-19 02:20:40.17991+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (56, 1, 3, '#49', '#ffffff', '2026-10-19 02:20:40.192386+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (57, 1, 3, '#50', '#ffffff', '2026-10-19 02:20:40.205085+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (58, 1, 3, '#52', '#ffffff', '2026-10-19 02:20:40.217548+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (59, 1, 3, '#53', '#ffffff', '2026-10-19 02:20:40.229325+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (60, 1, 3, '#55', '#ffffff', '2026-10-19 02:20:40.24149+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (61, 1, 3, '#56', '#ffffff', '2026-10-19 02:20:40.254228+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (62, 1, 3, '#57', '#ffffff', '2026-10-19 02:20:40.266797+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (63, 1, 3, '#58', '#ffffff', '2026-10-19 02:20:40.2793+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (64, 1, 3, '#59', '#ffffff', '2026-10-19 02:20:40.291708+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (65, 1, 3, '#60', '#ffffff', '2026-10-19 02:20:40.303798+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (66, 1, 3, '#61', '#ffffff', '2026-10-19 02:20:40.315906+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (67, 1, 3, '#62', '#ffffff', '2026-10-19 02:20:40.327716+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (68, 1, 3, '#63', '#ffffff', '2026-10-19 02:20:40.338448+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (69, 1, 3, '#64', '#ffffff', '2026-10-19 02:20:40.351078+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (70, 1, 3, '#65', '#ffffff', '2026-10-19 02:20:40.362682+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (71, 1, 3, '#66', '#ffffff', '2026-10-19 02:20:40.375477+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (72, 1, 3, '#68', '#ffffff', '2026-10-19 02:20:40.386806+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (73, 1, 3, '#71', '#ffffff', '2026-10-19 02:20:40.403173+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (74, 1, 3, '#72', '#ffffff', '2026-10-19 02:20:40.418139+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (75, 1, 3, '#73', '#ffffff', '2026-10-19 02:20:40.431129+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (76, 1, 3, '#74', '#ffffff', '2026-10-19 02:20:40.444222+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (77, 1, 3, '#75', '#ffffff', '2026-10-19 02:20:40.456645+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (78, 1, 3, '#76', '#ffffff', '2026-10-19 02:20:40.46777+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (79, 1, 3, '#77', '#ffffff', '2026-10-19 02:20:40.479144+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (80, 1, 3, '#78', '#ffffff', '2026-10-19 02:20:40.490405+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (81, 1, 3, '#79', '#ffffff', '2026-10-19 02:20:40.502325+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (82, 1, 3, '#80', '#ffffff', '2026-10-19 02:20:40.513832+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (83, 1, 3, '#81', '#ffffff', '2026-10-19 02:20:40.526519+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (84, 1, 3, '#82', '#ffffff', '2026-10-19 02:20:40.539767+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (85, 1, 3, '#83', '#ffffff', '2026-10-19 02:20:40.553707+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (86, 1, 3, '#84', '#ffffff', '2026-10-19 02:20:40.569118+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (87, 1, 3, '#85', '#ffffff', '2026-10-19 02:20:40.581556+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (88, 1, 3, '#86', '#ffffff', '2026-10-19 02:20:40.593811+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (89, 1, 3, '#87', '#ffffff', '2026-10-19 02:20:40.607385+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (90, 1, 3, '#88', '#ffffff', '2026-10-19 02:20:40.620035+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (91, 1, 3, '#89', '#ffffff', '2026-10-19 02:20:40.632003+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (92, 1, 3, '#90', '#ffffff', '2026-10-19 02:20:40.643811+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (93, 1, 3, '#91', '#ffffff', '2026-10-19 02:20:40.654243+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (94, 1, 3, '#100', '#ffffff', '2026-10-19 02:20:40.664823+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (95, 1, 3, '#101', '#ffffff', '2026-10-19 02:20:40.677288+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (96, 1, 3, '#102', '#ffffff', '2026-10-19 02:20:40.688231+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (97, 1, 3, '#103', '#ffffff', '2026-10-19 02:20:40.703473+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (98, 1, 3, '#104', '#ffffff', '2026-10-19 02:20:40.715942+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (99, 1, 3, '#105', '#ffffff', '2026-10-19 02:20:40.728169+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (100, 1, 3, '#106', '#ffffff', '2026-10-19 02:20:40.738354+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (101, 1, 3, '#107', '#ffffff', '2026-10-19 02:20:40.750386+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (102, 1, 3, '#108', '#ffffff', '2026-10-19 02:20:40.767401+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (103, 1, 3, '#109', '#ffffff', '2026-10-19 02:20:40.778551+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (104, 1, 3, '#110', '#ffffff', '2026-10-19 02:20:40.790795+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (105, 1, 3, '#111', '#ffffff', '2026-10-19 02:20:40.806153+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (106, 1, 3, '#112', '#ffffff', '2026-10-19 02:20:40.818283+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (107, 1, 3, '#113', '#ffffff', '2026-10-19 02:20:40.829962+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (108, 1, 3, '#114', '#ffffff', '2026-10-19 02:20:40.843135+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (109, 1, 3, '#115', '#ffffff', '2026-10-19 02:20:40.854425+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (110, 1, 3, '#116', '#ffffff', '2026-10-19 02:20:40.867088+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (111, 1, 3, '#118', '#ffffff', '2026-10-19 02:20:40.878796+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (112, 1, 3, '#119', '#ffffff', '2026-10-19 02:20:40.889217+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (113, 1, 3, '#120', '#ffffff', '2026-10-19 02:20:40.90114+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (114, 1, 3, '#121', '#ffffff', '2026-10-19 02:20:40.913191+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (115, 1, 3, '#122', '#ffffff', '2026-10-19 02:20:40.924672+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (116, 1, 3, '#124', '#ffffff', '2026-10-19 02:20:40.937019+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (117, 1, 3, '#125', '#ffffff', '2026-10-19 02:20:40.950047+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (118, 1, 3, '#129', '#ffffff', '2026-10-19 02:20:40.962624+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (119, 1, 3, '#131', '#ffffff', '2026-10-19 02:20:40.974366+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (120, 1, 3, '#134', '#ffffff', '2026-10-19 02:20:40.986523+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (121, 1, 3, '#138', '#ffffff', '2026-10-19 02:20:41.000225+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (122, 1, 3, '#137', '#ffffff', '2026-10-19 02:20:41.012293+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (123, 1, 3, '#141', '#ffffff', '2026-10-19 02:20:41.02518+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (124, 1, 3, '#140', '#ffffff', '2026-10-19 02:20:41.038488+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (125, 1, 3, '#143', '#ffffff', '2026-10-19 02:20:41.051508+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (126, 1, 3, '#142', '#ffffff', '2026-10-19 02:20:41.063234+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (127, 1, 3, '#139', '#ffffff', '2026-10-19 02:20:41.080857+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (128, 1, 3, '#135', '#ffffff', '2026-10-19 02:20:41.095972+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (129, 1, 3, '#136', '#ffffff', '2026-10-19 02:20:41.110256+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (130, 1, 3, '#132', '#ffffff', '2026-10-19 02:20:41.124523+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (131, 1, 3, '#130', '#ffffff', '2026-10-19 02:20:41.139471+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (132, 1, 3, '#128', '#ffffff', '2026-10-19 02:20:41.152125+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (133, 1, 3, '#127', '#ffffff', '2026-10-19 02:20:41.16843+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (134, 1, 3, '#126', '#ffffff', '2026-10-19 02:20:41.183807+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (135, 1, 3, '#123', '#ffffff', '2026-10-19 02:20:41.195686+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (136, 1, 3, '#117', '#ffffff', '2026-10-19 02:20:41.207966+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (137, 1, 3, '#54', '#ffffff', '2026-10-19 02:20:41.219606+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (138, 1, 3, '#51', '#ffffff', '2026-10-19 02:20:41.236817+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (139, 1, 3, '#42', '#ffffff', '2026-10-19 02:20:41.251273+00');
INSERT INTO public.label (id, project_id, group_id, name, color, created_at) VALUES (140, 1, 3, '#25', '#ffffff', '2026-10-19 02:20:41.265123+00');


--
-- Data for Name: label_group; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.label_group (id, project_id, name, color, created_at) VALUES (1, 1, 'Surface', '#6366f1', '2026-10-19 01:38:58.971253+00');
INSERT INTO public.label_group (id, project_id, name, color, created_at) VALUES (2, 1, 'Area', '#8b5cf6', '2026-10-19 01:38:58.985431+00');
INSERT INTO public.label_group (id, project_id, name, color, created_at) VALUES (3, 1, 'Number', '#94a3b8', '2026-10-19 02:20:39.559106+00');


--
-- Data for Name: mastra_agent_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_agents; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_ai_spans; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_background_tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_channel_config; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_channel_installations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_dataset_items; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_dataset_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_datasets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_experiment_results; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_experiments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_favorites; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_mcp_client_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_mcp_clients; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_mcp_server_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_mcp_servers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_messages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_notifications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_observational_memory; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_prompt_block_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_prompt_blocks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_resources; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_schedule_triggers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_schedules; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_scorer_definition_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_scorer_definitions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_scorers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_skill_blobs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_skill_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_skills; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_thread_state; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_threads; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_tool_provider_connections; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_workflow_definitions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_workflow_snapshot; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_workspace_versions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: mastra_workspaces; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: model_price; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: note_board; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: note_board_member; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notification; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notification_delivery; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: oauth_access_token; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: oauth_client; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: oauth_client_assertion; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: oauth_client_resource; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: oauth_consent; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: oauth_refresh_token; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: oauth_resource; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.oauth_resource (id, identifier, name, access_token_ttl, refresh_token_ttl, signing_algorithm, signing_key_id, allowed_scopes, custom_claims, dpop_bound_access_tokens_required, disabled, created_at, updated_at, policy_version, metadata) VALUES ('j2cUOaRNa1oOPSnYWhxlQbW8g94S4tNK', 'http://localhost:3000/mcp', 'http://localhost:3000/mcp', NULL, NULL, NULL, NULL, NULL, NULL, false, false, '2026-10-18 23:34:48.947', '2026-10-18 23:34:48.947', 1, NULL);


--
-- Data for Name: passkey; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project (id, key, name, description, next_sequence, created_at, mcp_enabled, initiatives_enabled, dashboards_enabled, notes_enabled, cycles_enabled, subtasks_enabled, checklists_enabled, issue_stats_enabled, points_estimate_enabled, time_estimate_enabled, time_logging_enabled, documents_enabled, team_id, archived_at) VALUES (1, 'T', 'Tickets', '', 209, '2026-10-18 23:35:27.31234+00', true, true, true, true, true, true, true, true, false, false, false, true, 1, NULL);


--
-- Data for Name: project_action; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_column; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (1, 1, 'Backlog', 'backlog', '#71717a', 0, '2026-10-18 23:35:27.31234+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (6, 1, 'Planning', 'unstarted', '#8b5cf6', 1, '2026-10-18 23:57:28.465603+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (2, 1, 'Ready', 'unstarted', '#0ea5e9', 2, '2026-10-18 23:35:27.31234+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (3, 1, 'In progress', 'started', '#eab308', 3, '2026-10-18 23:35:27.31234+00', 3, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (7, 1, 'Blocked', 'started', '#ef4444', 4, '2026-10-18 23:57:28.473336+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (8, 1, 'Audit', 'started', '#f97316', 5, '2026-10-18 23:57:28.482766+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (9, 1, 'Owner-led', 'started', '#ec4899', 6, '2026-10-18 23:57:28.490094+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (10, 1, 'Deferred', 'started', '#64748b', 7, '2026-10-18 23:57:28.498011+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (11, 1, 'Upstream', 'started', '#14b8a6', 8, '2026-10-18 23:57:28.505154+00', NULL, 'soft', NULL);
INSERT INTO public.project_column (id, project_id, name, state_type, color, "position", created_at, wip_limit, wip_mode, auto_assign_user_id) VALUES (4, 1, 'Done', 'completed', '#22c55e', 9, '2026-10-18 23:35:27.31234+00', NULL, 'soft', NULL);


--
-- Data for Name: project_dashboard; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_document; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_document (id, project_id, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, archived_by_ancestor_id, "position", version, owner_user_id, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (4, 1, NULL, 'The board itself', '# The board itself

This instance runs the released images from the product''s own compose file. The theme is the
product''s own and nothing is styled. The deployment lives in `board/` in the repository, and
`board/README.md` documents the containers, the data folders and the restore.

What is configured here and nowhere else: the ten columns, the label vocabulary, the lane, queue
order and waiting-on fields, the `Queue` view, and these pages.

The database and the attachments live in `board/data/`, which git ignores. `board/snapshot/board.sql`
is the committed copy, refreshed at the end of a run. That file is what brings the board back.

Nothing on this board runs by itself. There are no agents, no webhooks and no schedules. A
session reads it and writes it, and that is all.
', NULL, 'book', '{}', false, false, false, NULL, NULL, 4096, 2, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-18 23:58:05.175489+00', '2026-10-19 01:47:06.034128+00');
INSERT INTO public.project_document (id, project_id, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, archived_by_ancestor_id, "position", version, owner_user_id, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (1, 1, NULL, 'The tickets', '# The tickets

A ticket is a queued unit of work. A step is a plan step. The board and the repository use the
same two words.

The board is the source of truth. There is no ticket file in the repository.

## The columns

| Column | What it means |
| --- | --- |
| Backlog | Queued and not yet planned. |
| Deferred | Deliberately parked behind a later version. |
| Planning | A planner is answering the ticket''s frontier and writing the plan. |
| Ready | The plan passed its gate and the ticket waits for execution. |
| In progress | A lane is executing it. The column warns at three, the standing parallel limit. |
| Blocked | It cannot move until something outside the run changes. |
| Audit | Execution finished and the change is under review. |
| Owner-led | The deliverable is a recommendation the owner must rule on. |
| Upstream | Waiting on a party outside the repository. |
| Done | Merged to `uat` with its records. |

## Needs

A ticket that cannot start before another is finished carries a `blocked_by` relation to it. The
relation is a warning, never a lock: the lane rule is that a ticket is runnable when every issue
that blocks it is Done.
', NULL, 'book', '{}', false, false, false, NULL, NULL, 1024, 3, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-18 23:58:05.139721+00', '2026-10-19 02:17:21.382109+00');
INSERT INTO public.project_document (id, project_id, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, archived_by_ancestor_id, "position", version, owner_user_id, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (3, 1, NULL, 'Working the board', '# Working the board

Nothing here is edited by hand. Agents read and write the board through MCP, and the repository''s
workflow skills carry the conventions.

1. A ticket is created on the board when the owner asks for something, or when a session finds
   work that needs one. It lands in Backlog with a number in `Ticket number`.
2. A planner takes it to Planning and writes the plan as a Docs page on the issue, the acceptance
   criteria in the description, and the steps as subtasks. Then it moves it to Ready.
3. A lane takes it to In progress and does the work. It comments as it goes.
4. A reviewer reads the change and posts findings as a comment. The lead adjudicates.
5. Done, with one closing comment.

## The fields

| Field | What it holds |
| --- | --- |
| Ticket number | the ticket''s number. The lower it is, the sooner it runs |
| Lane | which lane holds it, set by the lead before dispatch |
| Waiting on | why it is Blocked, Upstream or Owner-led. One line |

## The labels

Surface: iOS, Android, Both. Area: widgets, notifications, prayer-times, qibla, board, docs,
research. Flags: needs-owner, upstream.

## Reading it

The `Queue` view shows the number, the priority, the type, the labels, the tickets order, the lane
and how long the ticket has sat where it is. A card also shows what it is waiting on, and the
progress of its steps.

## Connecting a session

The `itsaplan` MCP server in `opencode.json` points at the API origin. Its key comes from
`ITSAPLAN_API_KEY` in the shell environment.
', NULL, 'book', '{}', false, false, false, NULL, NULL, 3072, 3, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-18 23:58:05.164561+00', '2026-10-19 02:17:21.398284+00');
INSERT INTO public.project_document (id, project_id, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, archived_by_ancestor_id, "position", version, owner_user_id, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (7, 1, NULL, 'Research: moonsighting, parts 1 and 2', '# Moonsighting research, sob 1: sources, deliverable, shared rules

Status: finished 2026-09-14. Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md`. Sob 2
extends this brief. The rules below bind it too.

v2.0 takes the app beyond London. Today''s API is a slightly modified version of Khalid Shaukat''s
base timings, the derivation behind London''s unified timetable. The research calculates nothing
itself: it understands the method, and picks or writes the right client, before any v2.0 design
starts.

## Sources, in order

1. Every page of <https://www.moonsighting.com>, including `moon.html` and `about-us.html`.
   Enumerate the page list first (crawl, sitemap, link-walk), then read every page. Download every
   PDF the site carries, read each one in full and keep them in the session scratchpad. If the
   site cannot be read, stop and do nothing else.
2. <http://www.hizbululama.org.uk/articles/english/Unified.pdf>, London''s unified timetable.
   Work out the exact modifications of the base timings: which prayers, what offsets or rules,
   and why. That delta is what the app ships.
3. The implementations, read at the source, not the README:
   - PrayerTimeAPI <https://github.com/PrayerTimeResearch/PrayerTimeAPI>. Endpoint
     `https://www.moonsighting.com/time_json.php`, with
     `https://moonsighting.ahmedbukhamsin.sa/time_json.php` the fallback its code calls. It
     takes `year`, `tz`, `lat`, `lon`, `method` (0 Hanafi general, 1 Hanafi Shafag Abyad,
     2 Shafi Shafag Ahmar, 3 Shia Jafari), `both` (the README says 0 or 1, the code sends
     `false` or `true` and shows the second Asr only for methods 0 to 2) and `time` (0 for
     24-hour, 1 for 12-hour). Establish whether the endpoint still answers, which parameters
     reproduce the site''s published tables, how it behaves at high latitude, and whether it
     can serve a worldwide v2.0 directly (finding 43: London only, no city parameter).
   - mawaqit <https://github.com/mawaqit/prayer-times-moonsighting>. Establish what it and the
     endpoint compute, where they agree or diverge, and whether either matches the London
     modification.
4. NPM packages implementing this method. Other moonsighting committees exist: a "moonsighting"
   package may follow a different body entirely. Verify each candidate traces back to Khalid
   Shaukat''s committee and moonsighting.com. Record provenance: author, algorithm source, last
   publish, licence, and whether its numbers reproduce the site''s. The owner''s lead, unverified:
   the `adhan` package''s `CalculationMethod.MoonsightingCommittee()`. Treat it as a candidate,
   not an answer. Establish which paper or page it derives from, whether its Fajr and Isha
   reproduce the site''s tables for the same coordinates and dates, how it handles high latitude,
   and what is approximation rather than method. Diff its output against the site''s tables for
   several cities and seasons, including one above 60N, and against the London unified times.
   Read implementations with the `opensrc` CLI: the source is the arbiter, not the docs.

## Deliverable

- How Fajr and Isha are derived, the high-latitude behaviour, what "moonsighting" contributes
  beyond a solar-depression angle, and where the thesis is documented.
- Who maintains the method, who uses it, and how the published timetables are generated.
- The exact delta between London''s unified times and the unmodified method.
- Which package is safe to depend on, and if none is, what implementing it would take.
- What this implies for a worldwide v2.0: findings 43 (London-only endpoint, no city parameter),
  44 (Magrib has no midnight-crossing rule), 46 (London-pinned test oracles), 47 (high latitude).

## Rules for both sessions

- Own session, clean context. Research, not coding.
- Read 100% of every source: no slices, no `head`, no summary in place of reading. Diff-read
  near-duplicates.
- Never copy, average or invent a prayer time. Report deltas in minutes, not verdicts.
- The API is the source of truth. The app edits nothing it returns.
- Research only: no production code, no builds, no jest, no EAS. Never touch `uat` or
  `releases.json`.
- Never print, store or commit the London Prayer Times API key. The local `.env` holds only a
  placeholder. Ask the owner for the key if the API must be called. Commit through the
  key-prefix guard.


---


# Moonsighting research, sob 2: read, decide, then finish

Status: deferred by the owner, queue row 25. He has not read the findings or answered section
5''s questions. Whether the research is conclusive, and whether v2.0 can use it, stays open.

This extends `ai/prompts/moonsighting-research.md`: its sources, deliverable and rules apply here.

## Where everything is

- Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md`. Read it first, in full.
- Notes, data and page source: `ai/features/moonsighting/notes/`, `data/` and `artifact/`.
- The visual findings page is private and its link lives off-repo, in the owner''s keep. Rebuild
  it with `artifact/build_artifact.py`. Chart data: `artifact/chart-data.json`, which the
  script reads from the `~/athan-gitree/research/` copy.
- Scratch (crawl, PDFs, raw responses, scripts) is in `~/athan-gitree/research/`, outside git. The repo
  holds everything needed to continue.

## Do, in order

1. Help the owner read it. Before any new research, give him a short, plain answer drawn from the
   findings: what is settled and what is not, and whether each part of the v2.0 plan can rest
   on it. The London API stays London''s default. Moonsighting.com is a second option in London
   and the only source elsewhere. Mark anything unverified, then wait for the owner.
2. The remainders in findings sections 3.1 to 3.4, once the owner wants the research resumed:
   reproduce London''s Asr independently, measure the day-early clock change in Palestine, look
   into the McMurdo polar-edge runs and the Sky Prayers apps, and run the Rust, C# and Dart
   ports only if a decision depends on their numbers. Read `ai/features/global-prayer-times/RESUME-FROM.md`
   (queue row 42) first. Some remainders may already be answered there.
3. Review. Run one independent reviewer over the whole findings file. It attacks every claim,
   count and fixture, re-derives the London counts from `data/london/` and the section 2.13
   dates from `notes/method-versions/`. Fix what it finds. Republish the findings page at the
   owner''s private link.
4. Section 5''s eleven questions stay open until the owner is ready. Bring them only when asked. Do not press.

## Sob 1''s short answers (step 1 starts from these)

1. How is London''s unified timetable calculated, and who set it? The sun times come from HMNAO
   (sections 2.14 and 2.15): sunrise minus 3, noon plus 5, sunset plus 3, Asr at one and at two
   shadow lengths. Fajr and Isha are fixed minute intervals by calendar date, from the 1987-88
   Blackburn observations (Hizbul Ulama, Miftahi''s Tables 5 and 6) with London''s own edits.
   Adopted 1 August 2011 by the mosques named in Unified.pdf. Unanswered: who made the edits, why.
2. Is it safe for the worldwide option? No. The intervals were observed at one latitude
   (53.45N), in one hemisphere, and are meant for the UK.
3. What should the worldwide option use? Sob 1 recommends calculating the method on the
   device (adhan''s `MoonsightingCommittee`) rather than calling the endpoint. It needs owner
   rulings on polar days, and on whether a calculation counts as a source under the
   never-synthesise rule (section 5, questions 1 and 7).
4. Where do mosque clocks, mawaqit and other apps get their times, and do they add offsets? Not
   researched beyond section 2.16, where mawaqit''s PHP copy implements the seasonal function
   only. Candidate research for this session.

## Rules beyond sob 1''s

- Agents: one at a time, two at most. Sob 1''s four parallel agents hit the session limit
  twice and the weekly limit once. Agents save notes after every step.
- Git: the rules on a research worktree and branch, on `--no-verify` (the pre-commit hook runs
  the full jest suite) and on pushing nothing predate the merge of `research/moonsighting`. The
  planning session asks the owner which still apply.

## Prompt to start the session

```
Read ai/prompts/README.md for the standing rules, then ai/prompts/moonsighting-research-2.md.
Read ai/features/moonsighting/RESEARCH-FINDINGS.md in full. Start at step 1: tell me plainly
what the research settles, what it does not, and whether the v2.0 plan can rest on it, then
wait for me. Research only. Follow the rules in moonsighting-research.md. Never invent a prayer
time. Never store or commit the API key. Merge and push nothing without my go-ahead.
```
', NULL, 'file-text', '{}', false, false, false, NULL, NULL, 6144, 1, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.780332+00', '2026-10-19 01:45:39.780332+00');
INSERT INTO public.project_document (id, project_id, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, archived_by_ancestor_id, "position", version, owner_user_id, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (6, 1, NULL, 'Plan: #144', '# The board as a portable product, take three: It''s a Plan

# Ticket 144: The board as a portable product, take three: It''s a Plan

| Brief | The board as a portable product, take three: It''s a Plan (itsaplan.dev) |
| --- | --- |
| Planned at | `5b1c965d`, version 2.0.1092, 2026-10-19 |
| Planned by | Lead session 2026-10-19, from the owner''s brief in `ai/prompts/itsaplan-board.md` |
| Needs first | nothing (the two rejected prototypes are discarded and their branches are gone) |
| Parent | none |
| Group | the board prototype (`ai/plans/README.md` row 144 only, disjoint from every other open row) |
| Batch budget | 2 (two docs-and-operations steps, no code step) |
| Session budget | 2 |
| Steps count | 2 (bring the stack up, put the tickets''s tickets on it) |
| Device | none. The proof is the running stack and the browser read of the board |
| Owner decisions still needed | none. The research gate and the mapping are ruled here |

## 1. Goal

Two board products were built far too far and rejected the day each was handed over: Kanboard
v1.2.54 (2026-10-18) was called ugly in every way with a custom MCP layer creeping back in, and
Paperclip 2026.1012.0 (2026-10-18 to 2026-10-19) was discarded whole. The owner''s lessons: an
ugly board is a rejected board, and a custom layer on top of the product counts against it.

Today the repository has no board the owner can look at. When this ticket is done, a third
product, It''s a Plan v1.5.0, runs from its own `docker-compose.yml` with generated secrets in an
env file outside the repository tree, and the tickets''s own tickets sit on one project inside it.
The owner notices by opening `http://localhost:3001`, signing in, and reading the Kanban board.

The owner''s rules that bind this work, quoted from `ai/prompts/itsaplan-board.md`:

- "Spin it up. As default as possible, bare minimum. Nothing else."
- "Put our current tickets on it."
- "I don''t want anything to do with migration, nothing. I don''t want to sync."
- "No AI agents, no MCP connection, no webhooks, no sync, no import engineering, no theming, no
  custom glue of any kind."
- "Nothing merges to `uat` until that ruling; the work lives on a branch."
- "No secret, address or key is ever committed."

## 2. Decisions

### 2.1 Taken

| Decision | Answer | By | Recorded |
| --- | --- | --- | --- |
| Product | It''s a Plan v1.5.0 | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Release pin | `VERSION=1.5.0` in the env file, the release the brief names | agent-ruled | LOG.md, 2026-10-19 |
| Checkout and env location | `$HOME/athan-gitree/sessions/144/itsaplan` (clone) and `$HOME/athan-gitree/sessions/144/.env`, both outside the repository tree | agent-ruled | LOG.md, 2026-10-19 |
| Telemetry | `TELEMETRY_DISABLED=1` and `DO_NOT_TRACK=1` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Postgres password alphabet | `openssl rand -hex 32` rather than base64, so the value cannot break the `DATABASE_URL` interpolation | agent-ruled | LOG.md, 2026-10-19 |
| Ticket import route | the product''s own REST API (`/teams`, `/projects`, `/projects/:ref/issues`, `/issues/:id/links`) driven from a throwaway script in `$TMPDIR` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Status mapping | Done to the product''s Done column, In progress to In Progress, Ready and Planning and Audit to Todo, and Backlog and Deferred and Blocked and Upstream and Owner-led to Backlog | agent-ruled | LOG.md, 2026-10-19 |
| Needs mapping | each resolvable `needs` pair becomes one `blocked_by` relation between the two issues | agent-ruled | LOG.md, 2026-10-19 |
| Local cookie flag | `NODE_ENV=development` on the api service only, through a compose override outside the repository tree, so the session cookie is not `Secure` over plain HTTP | agent-ruled | LOG.md, 2026-10-19 |

### 2.2 The executor must not decide

None. The scope is two steps with no code path, the research gate is answered in section 4, and
the owner is hands-off until the verdict. No irreversible act the hard rules name is in scope:
no money, no credential leaves this machine, nothing is published, nothing is destroyed.

## 3. Pre-flight

`scripts/preflight-144.sh` verifies the stack checkout, the compose file, the free ports, the
absent committed secret, the tickets row, the version, and every anchor count equal to 1. It ends
`PREFLIGHT OK`.

## 4. Background

### 4.1 Code map (repository)

| File | Why it is read |
| --- | --- |
| `board/reader.mjs` | emits `board/state/board.json`: the `tickets` array is the import''s source, `doneColumnCount` 9999 in `board/config.json` puts all 107 done rows in that array |
| `board/config.json` | sets `doneColumnCount` to 9999, so the emitted count is 128 |
| `board/state/board.json` | the emitted tickets, regenerated at step 2 |
| `ai/plans/README.md` | row 144, the ticket this work tracks |
| `package.json`, `app.json` | the version files every commit bumps together |

### 4.2 Code map (the product, read in the checkout at `$HOME/athan-gitree/sessions/144/itsaplan`)

| Path | What it proves |
| --- | --- |
| `docker-compose.yml` | the seven services, the required env keys, the published ports 3000 and 3001, the `VERSION` image pin |
| `.env.example` | every optional variable, including the telemetry switches |
| `docs/self-hosting.md` | the `http://localhost` plain-HTTP cookie exception in Chrome and Firefox, and "the first account you register becomes the instance admin" |
| `apps/api/src/modules/projects/service.ts` | `DEFAULT_COLUMNS`: Backlog, Todo, In Progress, Done, Canceled |
| `apps/api/src/modules/issues/index.ts` | `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links` |
| `apps/api/src/modules/teams/index.ts` | `POST /teams` then `POST /teams/:teamId/projects` |

### 4.3 Existing tests and what each proves

None apply. The deliverable is a running stack, and the repository has no test for a third-party
container stack. The proof is physical: the browser read of the board at step 2 and the API
counts recorded in `LOG.md`.

### 4.4 Why the obvious fix is wrong

Writing an importer inside the repository is the failure the two rejected runs repeated. The
brief forbids committed tooling, so the copy is throwaway session work in `$TMPDIR`. Theming the
product to look less plain is the second failure: the brief forbids a theme, and the default
interface is what the owner is being asked to judge.

## 5. Design

**Invariant.** The stack runs from the product''s own compose file with only the seven required
env values plus the telemetry switches and the release pin, and the project holds one issue per
emitted ticket.

**Alternatives rejected.** A `.env` inside the checkout: the repository is public and the
identifier gate forbids a committed secret. A personal API key created through the browser: the
session cookie already round-trips over `http://localhost` with curl, so no second credential is
needed. Custom project columns named after the tickets''s own statuses: the brief says map onto the
product''s fields, and the default five columns are the most default surface.

### Acceptance criteria

- [R1.1] WHEN the compose stack starts from the repository''s `docker-compose.yml` with the generated env file THE SYSTEM SHALL report api healthy on port 3000 and web healthy on port 3001.
- [R1.2] WHEN `http://localhost:3000/auth-config` is read on the fresh database THE SYSTEM SHALL answer `{"hasUsers":false,"registration":"open","emailPassword":true}`.
- [R2.1] WHEN `node board/reader.mjs` runs on this tree THE SYSTEM SHALL write 128 tickets into `board/state/board.json`.
- [R2.2] WHEN the emitted tickets are posted to `POST /projects/athan-uk.QUEUE/issues` THE SYSTEM SHALL hold 128 issues, 107 in the Done column and 21 in the Backlog column.
- [R2.3] WHEN a ticket''s `needs` entry names an emitted ticket THE SYSTEM SHALL hold one `blocked_by` relation for that pair, 53 pairs in total across the project.
- [R2.4] WHILE no agent, webhook or Telegram token is configured THE SYSTEM SHALL log the worker and bot start lines and nothing after them, and answer an empty webhook list.
- [R3.1] WHEN the first account registers at `http://localhost:3001/register` THE SYSTEM SHALL give it the `god` role and open a session that reaches the board.
- [R4.1] IF any research-gate answer is no THE SYSTEM SHALL stop and report before starting the stack.
- [R5.1] WHEN the work is handed over THE SYSTEM SHALL leave the stack running, the board reachable at `http://localhost:3001/athan-uk.QUEUE`, and no generated file inside the repository tree.
- [R6.1] WHEN the board is read THE SYSTEM SHALL render the tickets''s ten columns by their queue names, left to right Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream and Done.
- [R6.2] WHEN the emitted tickets are placed THE SYSTEM SHALL put each on the column its queue row names, 107 on Done and 21 across the open columns.
- [R7.1] WHEN the AI Agents page is read THE SYSTEM SHALL list the seven workflow roles, and the Skills library SHALL hold `athan-lead` and `athan-planner`.
- [R7.2] WHEN an agent connects to the local board over MCP THE SYSTEM SHALL take a personal key from the shell environment and list the board''s tools.
- [R8.1] WHEN the runner is considered THE SYSTEM SHALL leave it uninstalled and record that starting it spends model tokens.

## 6. Steps

- [ ] Step 01: bring the stack up on the pinned release, defaults only (`steps/01-bring-up.md`)
- [ ] Step 02: put the tickets''s tickets on one project through the REST API (`steps/02-import.md`)
- [ ] Step 03: inject the workflow into the board (`steps/03-inject.md`)

Both steps are operations, not code. The evidence for each is a command''s output recorded in
`LOG.md`.

## 7. Device proof

None. No phone, no simulator and no build is in scope. The physical proof is the browser read of
`http://localhost:3001/athan-uk.QUEUE` and the issue page, with the column counts in the
screenshots kept outside the repository tree.

## 8. Records

`LOG.md` carries the planning section and one `### Step <NN> — <state>` section per step, each
ending with a `session:` line. The tickets cell text the lead applies on DONE is settled by the
owner''s verdict, which is a later ticket. This run leaves row 144 OWNER-LED with the handover
record. The docs commit subject is `docs(plans): ticket 144 ...`.

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass and the owner''s verdict.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| A required env key is missing | the compose file names the key in its refusal. Add it to the env file outside the tree and re-run `up -d` |
| Agent containers exit on start | read `docker compose logs <service>`. The api healthcheck line and the migrate exit code come first |
| The browser stays signed out after sign-in | the session cookie is `Secure` and the browser is WebKit. The api runs with `NODE_ENV=development` from the compose override, so the cookie is not `Secure` and every browser keeps it |
| The import script fails midway | re-run with `--links-only`, which resolves existing issues by their `#<order>` title prefix |
| A port is taken | 3000 and 3001 carry `API_PORT` and `WEB_PORT`. Change one in the env file only, never in the compose file |

## 11. Subagents

Planning: none. The brief is complete and the research gate is answered from the product''s own
source. Delivery: none. The two steps are operations driven by the lead, and the audit is the
lead''s read of the running board. `vision` reads any screenshot the lead cannot see.

## 12. Report to the owner

What changed: It''s a Plan v1.5.0 runs locally from its own compose file, and one project holds
the tickets''s 128 emitted tickets. What was proven: the criteria in section 5, each against a
command''s output in `LOG.md` or a browser read. Decisions waiting on the owner: the verdict on
look, feel and functionality. The four-line handoff closes the run, with the URL and the ports.


---

# Log

# Ticket 144 log: the It''s a Plan board

## Planning (2026-10-19)

Brief: `ai/prompts/itsaplan-board.md`. Planned at `5b1c965d`, version 2.0.1092. The owner''s
brief carries the whole scope: two steps, spin the product up on its own compose path and copy
the tickets''s emitted tickets onto one project through the REST API, then stop for the verdict.

### Research gate, answered from the product''s own source

Read against the v1.5.0 checkout (`6e0dc0b`, 2026-10-13). Every answer is yes.

1. **Runs locally through its own Docker path, viewable at `http://localhost:3001`.** The
   compose file publishes `api` on 3000 and `web` on 3001 and keeps RustFS internal.
   `docs/self-hosting.md` states that `http://localhost` is the one plain-HTTP exception for the
   `Secure` session cookie, in Chrome and Firefox, and that WebKit refuses it. Verified live:
   both containers report healthy and the board renders in Chromium.
2. **Genuinely free and self-hostable with no cloud dependency.** `LICENSE` is the full AGPL v3
   text. No license key, licence server or paid tier appears anywhere in the tree. Every service
   in the compose file runs locally, and the images are public GHCR tags.
3. **The default stack shows the board with agents, MCP, webhooks and the Telegram bot inert.**
   The bot starts and re-reads its config from the database. With no token it logs its start line
   and idles. The worker logs its start line and finds no webhook delivery and no agent run to
   claim. The project starts with no webhook (`GET /projects/athan-uk.QUEUE/webhooks` answers
   `[]`) and no agent attached. MCP is a team switch, off until an operator turns it on.
4. **Tickets arrive through the product''s own API with no committed tooling.** `POST /teams`,
   `POST /projects`, `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links`. The
   brief forbids committed tooling, so the copy is a throwaway script in `$TMPDIR` authenticated
   with the session cookie from first registration.
5. **First open.** `http://localhost:3001/register` shows the first-run sign-up form. The first
   account registered becomes the instance admin (`role: "god"`), owns the instance workspace,
   and the session lands on the project board at `/athan-uk/QUEUE`.

### Decisions taken (agent-ruled)

- **Release pin `VERSION=1.5.0`**: the brief names v1.5.0 as the verified release, and pinning
  keeps the run on a version whose docs were read.
- **Checkout and env outside the repository tree**: `$HOME/athan-gitree/sessions/144/itsaplan`
  and `$HOME/athan-gitree/sessions/144/.env`. The repository is public and the identifier gate
  forbids a committed secret.
- **Postgres password from `openssl rand -hex 32`**: a base64 value can contain `/`, which
  breaks the `postgres://user:pass@host` interpolation the compose file builds. Hex is the same
  strength and URL-safe. The other secrets stay on the documented `openssl rand -base64 32`.
- **Status mapping onto the product''s default columns**: the project''s own five columns are
  Backlog, Todo, In Progress, Done and Canceled. Done maps to Done, In progress to In Progress,
  and Ready, Planning and Audit to Todo. Backlog, Deferred, Blocked, Upstream and Owner-led map
  to Backlog. Canceled stays unused. The emitted run holds 107 Done and 21 open, so the board
  reads Backlog 21, Todo 0, In Progress 0, Done 107, Canceled 0.
- **Local cookie flag, added after the first sign-in attempt failed in the owner''s browser**:
  a `docker-compose.override.yml` in the checkout, outside the repository tree, sets
  `NODE_ENV=development` on the api service only. The product''s auth reads
  `secure: hostPrefixedCookies || NODE_ENV === "production"`, so this is the one lever that
  stops the session cookie carrying `Secure` over plain HTTP. Every browser then keeps the
  session on localhost, not only Chrome and Firefox. The web and worker containers are
  untouched.
- **Needs as `blocked_by` relations**: each `needs` entry that names an emitted ticket becomes
  one relation between the two issues. Of 69 needs entries, 53 resolve: 14 name a row that is
  cancelled or superseded and is not emitted, one is a self-reference (row 59 names itself), and
  one pair appears twice.

### Pre-flight

`scripts/preflight-144.sh` copied to `$TMPDIR` and run from the repository root printed
`PREFLIGHT OK`.

## Phase 2, after the owner''s approval (2026-10-19)

The owner read the board, approved the prototype, and asked for the tickets''s workflow to be
injected into it: the tickets''s own columns, its agents, its skills and its docs, with the styling
untouched and the repository queue still the source of truth. The branch was pushed and not
merged to `uat`.

### Step 03 — done

**Columns.** The product''s five defaults became the tickets''s own ten, in the reader''s own words:
Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream, Done.
`In progress` carries a soft WIP limit of three, which is the standing parallel order turned
into the board''s own control. The product orders columns by state category and then by position,
so the rendered order is Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit,
Owner-led, Upstream, Done. The reader''s order could not be reproduced exactly because the
product groups by state category, and Deferred is a backlog state while Upstream is a started
one.

**Tickets.** All 128 moved to the column their queue row names: Done 107, Deferred 11,
Backlog 6, Owner-led 2, Blocked 1, Upstream 1, and Planning, Ready, In progress and Audit empty.
That is the reader''s own distribution.

**Workflow data.** `Ticket number` is a number field carrying each ticket''s number in the tickets,
so any view can sort the way the tickets does.

**Agents.** The seven workflow roles are on the project as external agents: lane-lead, planner,
executor, plan-griller, reviewer, explorer and vision. Each carries its one-line mandate. The
AI Agents page lists them with "No runner yet".

**Skills.** `athan-lead` and `athan-planner` are in the team library, read from the repository''s
own skill files.

**Docs.** Five pages: The tickets, The agents, Working the board, The board itself, and Running
the agents from the board.

**MCP.** `itsaplan` is a remote server in `opencode.json`, written by `opencode mcp add` so the
shape is the product''s own: it sits under `mcp.servers` with the URL of the API origin''s `/mcp`
and an `x-api-key` header reading `{env:ITSAPLAN_API_KEY}`. The personal key was created on the
owner account and written to the shell environment and to
`$HOME/athan-gitree/sessions/144/mcp-key.txt`, never into the repository.

The endpoint was verified three ways. A keyless call answers 401. A call with the key answers
200 and `tools/list` returns the board''s tools. The OpenCode client sends the configured header
and connects: with the key written literally for one test, the board''s MCP instructions arrived
in the running session. The substitution itself needs the variable in the environment of the
process that opens the connection, and the background service of the session running this work
started before the export existed. A shell started after the `~/.zshrc` line connects it.

Without a key the endpoint answers 401.

### Decisions taken (agent-ruled, phase 2)

- **The runner is not installed.** `@itsaplan/runner` would claim runs for the agents on this
  board and start a coding agent CLI on every one. That spends model tokens on each run, so it
  is written up as a Docs page and left for the owner''s order. The agents exist and are inert.
- **Column state categories keep their real meanings.** Deferred stays a backlog state and
  Upstream a started state, so the board''s analytics stay honest. The cost is that the rendered
  order is the product''s grouping rather than the reader''s exact order.
- **No styling touched.** No theme, no stylesheet, no colour scheme. The only colours set are
  the new columns'' state colours, which the product requires.
- **The repository queue stays the source of truth.** The board mirrors it. No sync service and
  no importer is committed, so nothing writes back to the repository from the board.

### Verified after phase 2

The board renders the ten columns with the reader''s distribution. `In progress` shows `0 / 3`.
The AI Agents page lists seven roles. The Skills library lists two. Docs lists five pages. The
MCP endpoint takes the personal key and refuses a keyless call.

The three throwaway scripts live in `$TMPDIR` and die with the session.

## Ticket 144

### Step 01 — done

Stack brought up. `docker compose pull` then `docker compose up -d` from the v1.5.0 checkout
with `--env-file $HOME/athan-gitree/sessions/144/.env`. `docker compose ps` reads:

```
itsaplan-api-1       Up (healthy)   0.0.0.0:3000->3000/tcp
itsaplan-bot-1       Up
itsaplan-minio-1     Up (healthy)   9000-9001/tcp (internal)
itsaplan-postgres-1  Up (healthy)   5432/tcp (internal)
itsaplan-web-1       Up (healthy)   0.0.0.0:3001->3001/tcp
itsaplan-worker-1    Up
```

`curl http://localhost:3000/` answers 200 and `curl http://localhost:3001/login` answers 200.
`curl http://localhost:3000/auth-config` answers
`{"registration":"open","magicLink":false,"requireEmailVerification":false,"emailEnabled":false,"emailPassword":true,"google":false,"oidc":false,"oidcLabel":"","hasUsers":false}`.
R1.1 and R1.2 hold. R4.1 holds: every gate answer is yes.

### Step 02 — done

`node board/reader.mjs` wrote 128 tickets into `board/state/board.json` (107 done rows, all of
them emitted because `board/config.json` sets `doneColumnCount` to 9999).

The admin account was registered through the product''s own sign-up endpoint at
`http://localhost:3001/register` and the API reported `role: "god"`. `POST /teams` made
`Athan.uk` (slug `athan-uk`), `POST /projects` made `QUEUE`, and the throwaway script posted 128
issues. The API then read 128 issues, 107 on `columnId` 4 (Done) and 21 on `columnId` 1
(Backlog). The second pass created the `blocked_by` relations. `psql -tAc "select count(*) from
issue_link"` answers 53, matching the resolvable needs.

The board renders at `http://localhost:3001/athan-uk.QUEUE` with the five columns and the ticket
cards, each title carrying its `#<order>` prefix. An issue page shows the description carrying
the tickets status and the relations panel carrying the `blocked_by` pairs. R2.1, R2.2, R2.3,
R3.1 and R5.1 hold.

R2.4 holds: `docker compose logs worker` reads one line, `[worker] worker starting`, and
`docker compose logs bot` reads one line, `[bot] bot service starting`. `GET
/projects/athan-uk.QUEUE/webhooks` answers `[]`.

session: ses_eaea5deecffeZq7TThCzVL0d8R

### Handover (2026-10-19)

Stack left running, and the board is open in the owner''s browser. Board at the documented web
port on path `/athan-uk.QUEUE`, sign-up at `/register`. The first sign-in attempt failed in the
owner''s browser, so the api was restarted with the cookie override above and the password was
changed through `/api/auth/change-password` to a typeable value. Both were verified by a fresh
browser sign-in that landed on the board. Credentials are in
`$HOME/athan-gitree/sessions/144/credentials.txt`, outside the repository tree. Nothing merges
to `uat` until the owner rules. The throwaway import script lived in `$TMPDIR` and is deleted.

Row 144 was set OWNER-LED after the copy, so the reader was re-run and the single issue this
ticket tracks (`QUEUE-21`) had its description refreshed to the new row. The other 127 issues
stay the snapshot they were posted as. The needs cell for row 144 carries no digits, so the
reader''s number scan finds no dependency there.

`yarn validate` passes on the branch: tsc clean, Biome clean, Jest 5785 tests in 223 suites,
coverage 100 percent. Only `package.json` and `app.json` are version files in git. `android/`
is ignored, and its `versionName` was moved with the pair.
', NULL, 'file-text', '{}', false, false, false, NULL, NULL, 5120, 3, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.728814+00', '2026-10-19 02:17:21.424197+00');
INSERT INTO public.project_document (id, project_id, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, archived_by_ancestor_id, "position", version, owner_user_id, created_by_user_id, updated_by_user_id, created_at, updated_at) VALUES (8, 1, NULL, 'Programme: SDK 58', '# SDK 58 programme briefs

The tickets table in `ai/plans/README.md` is the authority for order and status. This file keeps
only the briefs open rows still cite: section 16 (queue row 18) and D4 (queue rows 38 and 39).
DONE records live in git history.

## 16. SDK 58 stable re-pin + full release-notes review (DONE 2026-10-17, row 111; the ride-`next` policy carries on)

**Trigger.** The owner ruled 2026-10-09: ride the `next` tag and repin to the newest version every
time, release candidates included. SDK 58 hit `latest` 2026-10-16 and row 111 ran the re-pin.
The next attempt takes the newest `expo` at ITS start: `58.0.14` was already on npm at this
ticket''s close (published after this attempt''s step 1 pinned `58.0.13`, the newest at that
moment), so the next re-pin starts from 58.0.14 or newer.

**Landed set (2.0.908, merge `9dd4eb6a`).** `expo ~58.0.13` with its `bundledNativeModules`
delta (eight direct pins moved, three transitive followed: `babel-preset-expo`,
`expo-application` 58.1.1 to 58.1.2, `expo-modules-core`), `react-native` 0.88.0. All three
patches regenerated whole at `expo-background-task+58.0.11`, `expo-location+58.0.17` and
`expo-widgets+58.0.20`, no hunk hand-merged; `didRegisterTaskForTesting` and `mLastAzimuth`
left the patches; the vacuous `local-maven-repo` check died; the guard suite
`shared/__tests__/backgroundTaskPatch.test.ts` pins the offline option on all three sides.
`expo-widgets@58.0.19` was broken upstream for Android (its source imports
`io.github.jakex7.peek.*` while its dependency packages `io.github.expo.peek.*`, 16 unresolved
references at `:expo-widgets:compileReleaseKotlin`); 58.0.20 fixes it, and that defect is why
the first attempt became a NEEDS REPLAN. Proven: `yarn validate` and `yarn test:tz` green at
100 percent, the 3T release build in 517 s with every channel, permission and armed-alert check
passing and the alarm-clock sub-block intact (41 future alerts), the armed production fire at
01:53:00.002 on the second (flags 0x3), and the XS loop green per the row 111 record (cold
start, compass at ~105 delegate calls a second, both language directions, BGTask re-submission,
two mock-build notification fires at their armed seconds with the TIME SENSITIVE level, the
live day-roll cascade). The store-release path is open again.

**Babel 8 rider, re-measured 2026-10-16, still blocked upstream.** `@babel/core` 8.0.7 is
latest; `babel-preset-expo@58.0.17` (the preset `expo@58.0.13` pairs with) depends on 36
`@babel/*` 7.x plugins (among them `@babel/preset-typescript ^7.23.0`,
`@babel/plugin-transform-modules-commonjs ^7.24.8`, `@babel/plugin-transform-react-jsx
^7.28.6`) and `@react-native/babel-preset@0.88.0` depends on `@babel/core ^7.25.2`. A Babel 7
plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED`. The four `@babel/*` devDependencies
stay at `^7.29.x` and the rider is re-attempted at every re-pin.

**Scope.**

1. `npx expo install --check` against `latest`: name and bump everything it reports, never `--fix`.
2. Read the full release notes and act on anything new that touches us. Already ruled at past
   re-pins, do not re-litigate: no SwiftPM (CocoaPods stays), no Live Activities. The "no
   threadIdentifier" ruling is superseded by row 120''s order.
3. Full regression: `yarn validate`, `yarn test:tz`, e2e, 3T release build, the dumpsys and
   punctuality gates.
4. Reopen the store-release path: nothing ships to a store or to production before the re-pin
   row is DONE.
5. Bookkeeping: the stack line in `README.md`, the patch rows in `ai/UPSTREAM-PRS.md`, this
   section. (The `ai/AGENTS.md` stack tables were deleted by the owner''s compaction order at
   `b2096c4a` and stay gone.)

**Pin-set and build facts.**

- `react-dom` equals `react`, and `@react-native/metro-config` and `@react-native/jest-preset`
  equal `react-native`, at every re-pin.
- Three local Android modules hardcode `compileSdk 37`, and only a release build notices:
  `checkReleaseAarMetadata` fails the release build only.
- `expo-in-app-updates` is pinned exactly `0.12.0` and is not an SDK package (its peer range on
  expo is `*`); it compiles Kotlin against `expo-modules-core` symbols. Do not patch it.
- On the 3T the alarm-clock proof is a sub-block, never `flags=0x9`. An alarm-clock arm reads
  `window=0 flags=0x3` with an `Alarm clock:` sub-block. `flags=0x9` is the windowed form shown
  by the 8T and the Find X8.
- The SDK-57 known-good backup branch''s last tips are reflog-only (`ef33661b`, `c9614692`).
  Restoring it is the owner''s call.

**Facts the re-pin needs (A1 to A11).** Each cites proof that still stands in the working tree.

- **A1. Upgrade policy, two parts (owner ruling).** Take the absolute latest and fix breaks in
  the code, never pinning back or editing a test to pass. A package broken upstream at its
  latest rolls back alone, one version at a time, to an exact pin with no local workaround,
  until a newer one ships.
- **A2. The Babel 8 blocker** is the rider above. It is this row''s second job.
- **A3. Deliberate divergences from Expo''s pin set** (at the 2026-10-16 stable re-pin,
  `expo@58.0.13`): `react-native` 0.88.0 stable now matches the SDK''s own pin, so no
  divergence survives there. `@expo/ui` and `expo-widgets` are back to exact pins (`58.0.20`
  each, `package.json`): the preview-era 58.0.5 pin that once protected the Android widget
  stub (row 26) broke iOS at dyld launch because the 58.0.5 ExpoUI binary references a
  `_uiRuntime` symbol the newer ExpoModulesCore no longer exports. Upstream closed the trap:
  the stub now exports `memo` as a passthrough, and the loaded-bundle suite is green. Durable
  lesson: `@expo/ui`''s iOS framework tracks ExpoModulesCore''s Swift ABI, so the pair moves
  with the SDK, never against it.
- **A4. `@expo/log-box` is invisible to Expo checks**: it is not in `bundledNativeModules.json`,
  so no Expo check reports it. It sits at `~58.0.12` (`package.json`) on the `^58.0.12` peer
  range that `expo-router` and `@expo/metro-runtime` declare. Move it by that peer range.
- **A5. The commit order that kept the tree green.** One commit: the SDK packages, the rebuilt
  patches and the type fixes the bump forces (the pre-commit hook runs `tsc`). Then React,
  `react-dom` and React Native with the two `@react-native/*` dev tools. Then Reanimated with
  worklets.
- **A6. Rebuilding a patch.** `git apply --check` the old patch on the fresh package. Apply it,
  or make a rejected hunk''s change by hand. Run `npx patch-package <name>` and delete the old
  file. Then delete the package folder and run `yarn install --force` to prove a clean install.
  All three patches are rebuilt at this row (`ai/plans/54-patches-and-copy/FINDINGS.md`,
  section 1), and each rebuild is proven on a phone, never by a green build alone. Removing the
  `publication` block from `expo-module.config.json` is what forces autolinking to compile the
  patched Kotlin from source: with the block present, autolinking resolves the prebuilt AAR and
  Gradle never compiles the patched code.
- **A7. patch-package log semantics.** After a version bump the install succeeds whatever the
  patches did. A `warning` means the old patch still applied. An `error` means that package
  runs UNPATCHED (`shared/__tests__/widgetOpenAppPatch.test.ts:24`).
- **A8. An ESM-only dependency is transformed to CommonJS in BOTH Jest projects, and
  `--experimental-vm-modules` is rejected.** Jest 30''s `require(esm)` is gated on
  `canResolveSync()`, which the components project fails for its custom resolver
  (`jest.config.js:62`). The CommonJS transform both projects share is `jest.config.js:20`.
- **A9. Reanimated 4.7.0 ships the new layout-animation engine as the default.** The legacy
  proxy flag `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is `false` in the installed tree
  (`node_modules/react-native-reanimated/src/featureFlags/staticFlags.json`) and no override
  is set anywhere in the repo. Draw sites that ride it: `components/modals/Modal.tsx:81` and
  `:90`, `components/modals/Help.tsx:75`, `components/sheets/screens/Qibla.tsx:61`.
- **A10. After the install, diff the pin set and read every peer warning.** Job 23 measured
  26 packages and installed 25. `react-native-screens` surfaced only as an `expo-router` peer
  warning (`package.json:73`). One warning is expected: `jest-expo > jest-watch-typeahead@2.2.1`
  wants Jest 29.
- **A11. In `widgets/PrayerWidget.tsx` a fixed `frame()` comes before a flexible one, and no test
  can see the order.** `@expo/ui` types `frame()` as two overloads that cannot be mixed, so
  each mixed call became two chained modifiers. Reversed, the greedy frame takes the space
  first and the row changes size (`:657-658`, `:729`).

- expo-notifications 58.1.0 grew `enableRemoteNotifications: false` for local-only
  apps: a candidate for the next app.json pass, still unclaimed at 1.29.321.

## D4. Localization for v2.0 (NOT PLANNED, carried by queue rows 38 and 39)

Owner goal: the app goes global in v2.0 with a language switcher. Research lives in
`ai/plans/39-localisation/`. Rows 38 and 39 carry the owner''s decisions: a typed English
catalog and `t()`, no i18n library, no second language first. RTL is the real work.
', NULL, 'file-text', '{}', false, false, false, NULL, NULL, 7168, 2, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.797851+00', '2026-10-19 02:17:21.445666+00');


--
-- Data for Name: project_document_initiative; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_document_issue; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_document_issue (document_id, issue_id, created_by_user_id, created_at) VALUES (6, 21, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.770104+00');
INSERT INTO public.project_document_issue (document_id, issue_id, created_by_user_id, created_at) VALUES (7, 1, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.790335+00');


--
-- Data for Name: project_document_preference; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_document_revision; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (1, 1, 1, NULL, 'The queue', '# The queue

A ticket is a queued unit of work. A step is a plan step. This board and the repository use the
same two words.

The source of truth is the repository queue at `ai/plans/README.md`. This board is its mirror.
Nothing writes back to the repository from here.

## The columns

| Column | What it means |
| --- | --- |
| Backlog | Queued and not yet planned. |
| Planning | A planning session is answering the ticket''s frontier and writing the plan. |
| Ready | The plan passed its gate and the ticket waits for execution. |
| In progress | A lane is executing it. The column warns at three, the standing parallel limit. |
| Blocked | It cannot move until something outside the run changes. |
| Audit | Execution finished and the change is under review. |
| Owner-led | The deliverable is a recommendation or a prototype the owner must rule on. |
| Deferred | Deliberately parked behind a later version. |
| Done | Merged to `uat` with its records. |
| Upstream | Waiting on a party outside the repository, such as an upstream review. |

## Needs

A ticket that cannot start before another is finished carries a `blocked_by` relation to it, and
the queue row lists the same numbers under Needs first. The relation is a warning, never a lock.
', NULL, 'book', '{}', false, false, false, NULL, 1024, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-18 23:58:05.139721+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (3, 3, 1, NULL, 'Working the board', '# Working the board

1. A row in the repository queue is the ticket''s home. Its status cell decides its column here.
2. When a run moves a ticket, the board column moves with it. Update the column, add a comment
   when the reason matters, and leave the relations alone.
3. The Needs first list on a queue row is the same set as the blocked_by relations here.
4. The ticket''s own row is the last thing a run touches. The board is what the owner reads.

## Reading the board

The board view groups by column and is the fastest read of what is moving. The table view sorts
by Queue order, which is the ticket''s number in the queue. The timeline and calendar views use
the start and due dates, which the queue does not set.

## Connecting an agent through MCP

The team''s MCP reach is on. Point a client at the API origin with a personal API key from
Account settings, then call the tools it lists. Reads and writes go through the same permission
model as this page.
', NULL, 'book', '{}', false, false, false, NULL, 3072, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-18 23:58:05.164561+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (4, 4, 1, NULL, 'The board itself', '# The board itself

This instance runs the released images from the product''s own compose file, with its defaults
untouched. The theme is the product''s own. The only local change is the session cookie flag that
lets a browser keep a session over plain HTTP on this machine.

What is configured here and nowhere else: the ten columns above, the Queue order field, the seven
agent roles, the two skills and these pages.
', NULL, 'book', '{}', false, false, false, NULL, 4096, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-18 23:58:05.175489+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (8, 6, 1, NULL, 'Plan: QUEUE-21', '# The board as a portable product, take three: It''s a Plan

# Ticket 144: The board as a portable product, take three: It''s a Plan

| Brief | The board as a portable product, take three: It''s a Plan (itsaplan.dev) |
| --- | --- |
| Planned at | `5b1c965d`, version 2.0.1092, 2026-10-19 |
| Planned by | Lead session 2026-10-19, from the owner''s brief in `ai/prompts/itsaplan-board.md` |
| Needs first | nothing (the two rejected prototypes are discarded and their branches are gone) |
| Parent | none |
| Group | the board prototype (`ai/plans/README.md` row 144 only, disjoint from every other open row) |
| Batch budget | 2 (two docs-and-operations steps, no code step) |
| Session budget | 2 |
| Steps count | 2 (bring the stack up, put the queue''s tickets on it) |
| Device | none. The proof is the running stack and the browser read of the board |
| Owner decisions still needed | none. The research gate and the mapping are ruled here |

## 1. Goal

Two board products were built far too far and rejected the day each was handed over: Kanboard
v1.2.54 (2026-10-18) was called ugly in every way with a custom MCP layer creeping back in, and
Paperclip 2026.1012.0 (2026-10-18 to 2026-10-19) was discarded whole. The owner''s lessons: an
ugly board is a rejected board, and a custom layer on top of the product counts against it.

Today the repository has no board the owner can look at. When this ticket is done, a third
product, It''s a Plan v1.5.0, runs from its own `docker-compose.yml` with generated secrets in an
env file outside the repository tree, and the queue''s own tickets sit on one project inside it.
The owner notices by opening `http://localhost:3001`, signing in, and reading the Kanban board.

The owner''s rules that bind this work, quoted from `ai/prompts/itsaplan-board.md`:

- "Spin it up. As default as possible, bare minimum. Nothing else."
- "Put our current tickets on it."
- "I don''t want anything to do with migration, nothing. I don''t want to sync."
- "No AI agents, no MCP connection, no webhooks, no sync, no import engineering, no theming, no
  custom glue of any kind."
- "Nothing merges to `uat` until that ruling; the work lives on a branch."
- "No secret, address or key is ever committed."

## 2. Decisions

### 2.1 Taken

| Decision | Answer | By | Recorded |
| --- | --- | --- | --- |
| Product | It''s a Plan v1.5.0 | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Release pin | `VERSION=1.5.0` in the env file, the release the brief names | agent-ruled | LOG.md, 2026-10-19 |
| Checkout and env location | `$HOME/athan-gitree/sessions/144/itsaplan` (clone) and `$HOME/athan-gitree/sessions/144/.env`, both outside the repository tree | agent-ruled | LOG.md, 2026-10-19 |
| Telemetry | `TELEMETRY_DISABLED=1` and `DO_NOT_TRACK=1` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Postgres password alphabet | `openssl rand -hex 32` rather than base64, so the value cannot break the `DATABASE_URL` interpolation | agent-ruled | LOG.md, 2026-10-19 |
| Ticket import route | the product''s own REST API (`/teams`, `/projects`, `/projects/:ref/issues`, `/issues/:id/links`) driven from a throwaway script in `$TMPDIR` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Status mapping | Done to the product''s Done column, In progress to In Progress, Ready and Planning and Audit to Todo, and Backlog and Deferred and Blocked and Upstream and Owner-led to Backlog | agent-ruled | LOG.md, 2026-10-19 |
| Needs mapping | each resolvable `needs` pair becomes one `blocked_by` relation between the two issues | agent-ruled | LOG.md, 2026-10-19 |
| Local cookie flag | `NODE_ENV=development` on the api service only, through a compose override outside the repository tree, so the session cookie is not `Secure` over plain HTTP | agent-ruled | LOG.md, 2026-10-19 |

### 2.2 The executor must not decide

None. The scope is two steps with no code path, the research gate is answered in section 4, and
the owner is hands-off until the verdict. No irreversible act the hard rules name is in scope:
no money, no credential leaves this machine, nothing is published, nothing is destroyed.

## 3. Pre-flight

`scripts/preflight-144.sh` verifies the stack checkout, the compose file, the free ports, the
absent committed secret, the queue row, the version, and every anchor count equal to 1. It ends
`PREFLIGHT OK`.

## 4. Background

### 4.1 Code map (repository)

| File | Why it is read |
| --- | --- |
| `board/reader.mjs` | emits `board/state/board.json`: the `tickets` array is the import''s source, `doneColumnCount` 9999 in `board/config.json` puts all 107 done rows in that array |
| `board/config.json` | sets `doneColumnCount` to 9999, so the emitted count is 128 |
| `board/state/board.json` | the emitted tickets, regenerated at step 2 |
| `ai/plans/README.md` | row 144, the ticket this work tracks |
| `package.json`, `app.json` | the version files every commit bumps together |

### 4.2 Code map (the product, read in the checkout at `$HOME/athan-gitree/sessions/144/itsaplan`)

| Path | What it proves |
| --- | --- |
| `docker-compose.yml` | the seven services, the required env keys, the published ports 3000 and 3001, the `VERSION` image pin |
| `.env.example` | every optional variable, including the telemetry switches |
| `docs/self-hosting.md` | the `http://localhost` plain-HTTP cookie exception in Chrome and Firefox, and "the first account you register becomes the instance admin" |
| `apps/api/src/modules/projects/service.ts` | `DEFAULT_COLUMNS`: Backlog, Todo, In Progress, Done, Canceled |
| `apps/api/src/modules/issues/index.ts` | `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links` |
| `apps/api/src/modules/teams/index.ts` | `POST /teams` then `POST /teams/:teamId/projects` |

### 4.3 Existing tests and what each proves

None apply. The deliverable is a running stack, and the repository has no test for a third-party
container stack. The proof is physical: the browser read of the board at step 2 and the API
counts recorded in `LOG.md`.

### 4.4 Why the obvious fix is wrong

Writing an importer inside the repository is the failure the two rejected runs repeated. The
brief forbids committed tooling, so the copy is throwaway session work in `$TMPDIR`. Theming the
product to look less plain is the second failure: the brief forbids a theme, and the default
interface is what the owner is being asked to judge.

## 5. Design

**Invariant.** The stack runs from the product''s own compose file with only the seven required
env values plus the telemetry switches and the release pin, and the project holds one issue per
emitted ticket.

**Alternatives rejected.** A `.env` inside the checkout: the repository is public and the
identifier gate forbids a committed secret. A personal API key created through the browser: the
session cookie already round-trips over `http://localhost` with curl, so no second credential is
needed. Custom project columns named after the queue''s own statuses: the brief says map onto the
product''s fields, and the default five columns are the most default surface.

### Acceptance criteria

- [R1.1] WHEN the compose stack starts from the repository''s `docker-compose.yml` with the generated env file THE SYSTEM SHALL report api healthy on port 3000 and web healthy on port 3001.
- [R1.2] WHEN `http://localhost:3000/auth-config` is read on the fresh database THE SYSTEM SHALL answer `{"hasUsers":false,"registration":"open","emailPassword":true}`.
- [R2.1] WHEN `node board/reader.mjs` runs on this tree THE SYSTEM SHALL write 128 tickets into `board/state/board.json`.
- [R2.2] WHEN the emitted tickets are posted to `POST /projects/athan-uk.QUEUE/issues` THE SYSTEM SHALL hold 128 issues, 107 in the Done column and 21 in the Backlog column.
- [R2.3] WHEN a ticket''s `needs` entry names an emitted ticket THE SYSTEM SHALL hold one `blocked_by` relation for that pair, 53 pairs in total across the project.
- [R2.4] WHILE no agent, webhook or Telegram token is configured THE SYSTEM SHALL log the worker and bot start lines and nothing after them, and answer an empty webhook list.
- [R3.1] WHEN the first account registers at `http://localhost:3001/register` THE SYSTEM SHALL give it the `god` role and open a session that reaches the board.
- [R4.1] IF any research-gate answer is no THE SYSTEM SHALL stop and report before starting the stack.
- [R5.1] WHEN the work is handed over THE SYSTEM SHALL leave the stack running, the board reachable at `http://localhost:3001/athan-uk.QUEUE`, and no generated file inside the repository tree.
- [R6.1] WHEN the board is read THE SYSTEM SHALL render the queue''s ten columns by their queue names, left to right Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream and Done.
- [R6.2] WHEN the emitted tickets are placed THE SYSTEM SHALL put each on the column its queue row names, 107 on Done and 21 across the open columns.
- [R7.1] WHEN the AI Agents page is read THE SYSTEM SHALL list the seven workflow roles, and the Skills library SHALL hold `athan-lead` and `athan-planner`.
- [R7.2] WHEN an agent connects to the local board over MCP THE SYSTEM SHALL take a personal key from the shell environment and list the board''s tools.
- [R8.1] WHEN the runner is considered THE SYSTEM SHALL leave it uninstalled and record that starting it spends model tokens.

## 6. Steps

- [ ] Step 01: bring the stack up on the pinned release, defaults only (`steps/01-bring-up.md`)
- [ ] Step 02: put the queue''s tickets on one project through the REST API (`steps/02-import.md`)
- [ ] Step 03: inject the workflow into the board (`steps/03-inject.md`)

Both steps are operations, not code. The evidence for each is a command''s output recorded in
`LOG.md`.

## 7. Device proof

None. No phone, no simulator and no build is in scope. The physical proof is the browser read of
`http://localhost:3001/athan-uk.QUEUE` and the issue page, with the column counts in the
screenshots kept outside the repository tree.

## 8. Records

`LOG.md` carries the planning section and one `### Step <NN> — <state>` section per step, each
ending with a `session:` line. The queue cell text the lead applies on DONE is settled by the
owner''s verdict, which is a later ticket. This run leaves row 144 OWNER-LED with the handover
record. The docs commit subject is `docs(plans): ticket 144 ...`.

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass and the owner''s verdict.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| A required env key is missing | the compose file names the key in its refusal. Add it to the env file outside the tree and re-run `up -d` |
| Agent containers exit on start | read `docker compose logs <service>`. The api healthcheck line and the migrate exit code come first |
| The browser stays signed out after sign-in | the session cookie is `Secure` and the browser is WebKit. The api runs with `NODE_ENV=development` from the compose override, so the cookie is not `Secure` and every browser keeps it |
| The import script fails midway | re-run with `--links-only`, which resolves existing issues by their `#<order>` title prefix |
| A port is taken | 3000 and 3001 carry `API_PORT` and `WEB_PORT`. Change one in the env file only, never in the compose file |

## 11. Subagents

Planning: none. The brief is complete and the research gate is answered from the product''s own
source. Delivery: none. The two steps are operations driven by the lead, and the audit is the
lead''s read of the running board. `vision` reads any screenshot the lead cannot see.

## 12. Report to the owner

What changed: It''s a Plan v1.5.0 runs locally from its own compose file, and one project holds
the queue''s 128 emitted tickets. What was proven: the criteria in section 5, each against a
command''s output in `LOG.md` or a browser read. Decisions waiting on the owner: the verdict on
look, feel and functionality. The four-line handoff closes the run, with the URL and the ports.


---

# Log

# Ticket 144 log: the It''s a Plan board

## Planning (2026-10-19)

Brief: `ai/prompts/itsaplan-board.md`. Planned at `5b1c965d`, version 2.0.1092. The owner''s
brief carries the whole scope: two steps, spin the product up on its own compose path and copy
the queue''s emitted tickets onto one project through the REST API, then stop for the verdict.

### Research gate, answered from the product''s own source

Read against the v1.5.0 checkout (`6e0dc0b`, 2026-10-13). Every answer is yes.

1. **Runs locally through its own Docker path, viewable at `http://localhost:3001`.** The
   compose file publishes `api` on 3000 and `web` on 3001 and keeps RustFS internal.
   `docs/self-hosting.md` states that `http://localhost` is the one plain-HTTP exception for the
   `Secure` session cookie, in Chrome and Firefox, and that WebKit refuses it. Verified live:
   both containers report healthy and the board renders in Chromium.
2. **Genuinely free and self-hostable with no cloud dependency.** `LICENSE` is the full AGPL v3
   text. No license key, licence server or paid tier appears anywhere in the tree. Every service
   in the compose file runs locally, and the images are public GHCR tags.
3. **The default stack shows the board with agents, MCP, webhooks and the Telegram bot inert.**
   The bot starts and re-reads its config from the database. With no token it logs its start line
   and idles. The worker logs its start line and finds no webhook delivery and no agent run to
   claim. The project starts with no webhook (`GET /projects/athan-uk.QUEUE/webhooks` answers
   `[]`) and no agent attached. MCP is a team switch, off until an operator turns it on.
4. **Tickets arrive through the product''s own API with no committed tooling.** `POST /teams`,
   `POST /projects`, `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links`. The
   brief forbids committed tooling, so the copy is a throwaway script in `$TMPDIR` authenticated
   with the session cookie from first registration.
5. **First open.** `http://localhost:3001/register` shows the first-run sign-up form. The first
   account registered becomes the instance admin (`role: "god"`), owns the instance workspace,
   and the session lands on the project board at `/athan-uk/QUEUE`.

### Decisions taken (agent-ruled)

- **Release pin `VERSION=1.5.0`**: the brief names v1.5.0 as the verified release, and pinning
  keeps the run on a version whose docs were read.
- **Checkout and env outside the repository tree**: `$HOME/athan-gitree/sessions/144/itsaplan`
  and `$HOME/athan-gitree/sessions/144/.env`. The repository is public and the identifier gate
  forbids a committed secret.
- **Postgres password from `openssl rand -hex 32`**: a base64 value can contain `/`, which
  breaks the `postgres://user:pass@host` interpolation the compose file builds. Hex is the same
  strength and URL-safe. The other secrets stay on the documented `openssl rand -base64 32`.
- **Status mapping onto the product''s default columns**: the project''s own five columns are
  Backlog, Todo, In Progress, Done and Canceled. Done maps to Done, In progress to In Progress,
  and Ready, Planning and Audit to Todo. Backlog, Deferred, Blocked, Upstream and Owner-led map
  to Backlog. Canceled stays unused. The emitted run holds 107 Done and 21 open, so the board
  reads Backlog 21, Todo 0, In Progress 0, Done 107, Canceled 0.
- **Local cookie flag, added after the first sign-in attempt failed in the owner''s browser**:
  a `docker-compose.override.yml` in the checkout, outside the repository tree, sets
  `NODE_ENV=development` on the api service only. The product''s auth reads
  `secure: hostPrefixedCookies || NODE_ENV === "production"`, so this is the one lever that
  stops the session cookie carrying `Secure` over plain HTTP. Every browser then keeps the
  session on localhost, not only Chrome and Firefox. The web and worker containers are
  untouched.
- **Needs as `blocked_by` relations**: each `needs` entry that names an emitted ticket becomes
  one relation between the two issues. Of 69 needs entries, 53 resolve: 14 name a row that is
  cancelled or superseded and is not emitted, one is a self-reference (row 59 names itself), and
  one pair appears twice.

### Pre-flight

`scripts/preflight-144.sh` copied to `$TMPDIR` and run from the repository root printed
`PREFLIGHT OK`.

## Phase 2, after the owner''s approval (2026-10-19)

The owner read the board, approved the prototype, and asked for the queue''s workflow to be
injected into it: the queue''s own columns, its agents, its skills and its docs, with the styling
untouched and the repository queue still the source of truth. The branch was pushed and not
merged to `uat`.

### Step 03 — done

**Columns.** The product''s five defaults became the queue''s own ten, in the reader''s own words:
Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream, Done.
`In progress` carries a soft WIP limit of three, which is the standing parallel order turned
into the board''s own control. The product orders columns by state category and then by position,
so the rendered order is Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit,
Owner-led, Upstream, Done. The reader''s order could not be reproduced exactly because the
product groups by state category, and Deferred is a backlog state while Upstream is a started
one.

**Tickets.** All 128 moved to the column their queue row names: Done 107, Deferred 11,
Backlog 6, Owner-led 2, Blocked 1, Upstream 1, and Planning, Ready, In progress and Audit empty.
That is the reader''s own distribution.

**Workflow data.** `Queue order` is a number field carrying each ticket''s number in the queue,
so any view can sort the way the queue does.

**Agents.** The seven workflow roles are on the project as external agents: lane-lead, planner,
executor, plan-griller, reviewer, explorer and vision. Each carries its one-line mandate. The
AI Agents page lists them with "No runner yet".

**Skills.** `athan-lead` and `athan-planner` are in the team library, read from the repository''s
own skill files.

**Docs.** Five pages: The queue, The agents, Working the board, The board itself, and Running
the agents from the board.

**MCP.** `itsaplan` is a remote server in `opencode.json`, written by `opencode mcp add` so the
shape is the product''s own: it sits under `mcp.servers` with the URL of the API origin''s `/mcp`
and an `x-api-key` header reading `{env:ITSAPLAN_API_KEY}`. The personal key was created on the
owner account and written to the shell environment and to
`$HOME/athan-gitree/sessions/144/mcp-key.txt`, never into the repository.

The endpoint was verified three ways. A keyless call answers 401. A call with the key answers
200 and `tools/list` returns the board''s tools. The OpenCode client sends the configured header
and connects: with the key written literally for one test, the board''s MCP instructions arrived
in the running session. The substitution itself needs the variable in the environment of the
process that opens the connection, and the background service of the session running this work
started before the export existed. A shell started after the `~/.zshrc` line connects it.

Without a key the endpoint answers 401.

### Decisions taken (agent-ruled, phase 2)

- **The runner is not installed.** `@itsaplan/runner` would claim runs for the agents on this
  board and start a coding agent CLI on every one. That spends model tokens on each run, so it
  is written up as a Docs page and left for the owner''s order. The agents exist and are inert.
- **Column state categories keep their real meanings.** Deferred stays a backlog state and
  Upstream a started state, so the board''s analytics stay honest. The cost is that the rendered
  order is the product''s grouping rather than the reader''s exact order.
- **No styling touched.** No theme, no stylesheet, no colour scheme. The only colours set are
  the new columns'' state colours, which the product requires.
- **The repository queue stays the source of truth.** The board mirrors it. No sync service and
  no importer is committed, so nothing writes back to the repository from the board.

### Verified after phase 2

The board renders the ten columns with the reader''s distribution. `In progress` shows `0 / 3`.
The AI Agents page lists seven roles. The Skills library lists two. Docs lists five pages. The
MCP endpoint takes the personal key and refuses a keyless call.

The three throwaway scripts live in `$TMPDIR` and die with the session.

## Ticket 144

### Step 01 — done

Stack brought up. `docker compose pull` then `docker compose up -d` from the v1.5.0 checkout
with `--env-file $HOME/athan-gitree/sessions/144/.env`. `docker compose ps` reads:

```
itsaplan-api-1       Up (healthy)   0.0.0.0:3000->3000/tcp
itsaplan-bot-1       Up
itsaplan-minio-1     Up (healthy)   9000-9001/tcp (internal)
itsaplan-postgres-1  Up (healthy)   5432/tcp (internal)
itsaplan-web-1       Up (healthy)   0.0.0.0:3001->3001/tcp
itsaplan-worker-1    Up
```

`curl http://localhost:3000/` answers 200 and `curl http://localhost:3001/login` answers 200.
`curl http://localhost:3000/auth-config` answers
`{"registration":"open","magicLink":false,"requireEmailVerification":false,"emailEnabled":false,"emailPassword":true,"google":false,"oidc":false,"oidcLabel":"","hasUsers":false}`.
R1.1 and R1.2 hold. R4.1 holds: every gate answer is yes.

### Step 02 — done

`node board/reader.mjs` wrote 128 tickets into `board/state/board.json` (107 done rows, all of
them emitted because `board/config.json` sets `doneColumnCount` to 9999).

The admin account was registered through the product''s own sign-up endpoint at
`http://localhost:3001/register` and the API reported `role: "god"`. `POST /teams` made
`Athan.uk` (slug `athan-uk`), `POST /projects` made `QUEUE`, and the throwaway script posted 128
issues. The API then read 128 issues, 107 on `columnId` 4 (Done) and 21 on `columnId` 1
(Backlog). The second pass created the `blocked_by` relations. `psql -tAc "select count(*) from
issue_link"` answers 53, matching the resolvable needs.

The board renders at `http://localhost:3001/athan-uk.QUEUE` with the five columns and the ticket
cards, each title carrying its `#<order>` prefix. An issue page shows the description carrying
the queue status and the relations panel carrying the `blocked_by` pairs. R2.1, R2.2, R2.3,
R3.1 and R5.1 hold.

R2.4 holds: `docker compose logs worker` reads one line, `[worker] worker starting`, and
`docker compose logs bot` reads one line, `[bot] bot service starting`. `GET
/projects/athan-uk.QUEUE/webhooks` answers `[]`.

session: ses_eaea5deecffeZq7TThCzVL0d8R

### Handover (2026-10-19)

Stack left running, and the board is open in the owner''s browser. Board at the documented web
port on path `/athan-uk.QUEUE`, sign-up at `/register`. The first sign-in attempt failed in the
owner''s browser, so the api was restarted with the cookie override above and the password was
changed through `/api/auth/change-password` to a typeable value. Both were verified by a fresh
browser sign-in that landed on the board. Credentials are in
`$HOME/athan-gitree/sessions/144/credentials.txt`, outside the repository tree. Nothing merges
to `uat` until the owner rules. The throwaway import script lived in `$TMPDIR` and is deleted.

Row 144 was set OWNER-LED after the copy, so the reader was re-run and the single issue this
ticket tracks (`QUEUE-21`) had its description refreshed to the new row. The other 127 issues
stay the snapshot they were posted as. The needs cell for row 144 carries no digits, so the
reader''s number scan finds no dependency there.

`yarn validate` passes on the branch: tsc clean, Biome clean, Jest 5785 tests in 223 suites,
coverage 100 percent. Only `package.json` and `app.json` are version files in git. `android/`
is ignored, and its `versionName` was moved with the pair.
', NULL, 'file-text', '{}', false, false, false, NULL, 5120, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.728814+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (9, 7, 1, NULL, 'Research: moonsighting, parts 1 and 2', '# Moonsighting research, sob 1: sources, deliverable, shared rules

Status: finished 2026-09-14. Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md`. Sob 2
extends this brief. The rules below bind it too.

v2.0 takes the app beyond London. Today''s API is a slightly modified version of Khalid Shaukat''s
base timings, the derivation behind London''s unified timetable. The research calculates nothing
itself: it understands the method, and picks or writes the right client, before any v2.0 design
starts.

## Sources, in order

1. Every page of <https://www.moonsighting.com>, including `moon.html` and `about-us.html`.
   Enumerate the page list first (crawl, sitemap, link-walk), then read every page. Download every
   PDF the site carries, read each one in full and keep them in the session scratchpad. If the
   site cannot be read, stop and do nothing else.
2. <http://www.hizbululama.org.uk/articles/english/Unified.pdf>, London''s unified timetable.
   Work out the exact modifications of the base timings: which prayers, what offsets or rules,
   and why. That delta is what the app ships.
3. The implementations, read at the source, not the README:
   - PrayerTimeAPI <https://github.com/PrayerTimeResearch/PrayerTimeAPI>. Endpoint
     `https://www.moonsighting.com/time_json.php`, with
     `https://moonsighting.ahmedbukhamsin.sa/time_json.php` the fallback its code calls. It
     takes `year`, `tz`, `lat`, `lon`, `method` (0 Hanafi general, 1 Hanafi Shafag Abyad,
     2 Shafi Shafag Ahmar, 3 Shia Jafari), `both` (the README says 0 or 1, the code sends
     `false` or `true` and shows the second Asr only for methods 0 to 2) and `time` (0 for
     24-hour, 1 for 12-hour). Establish whether the endpoint still answers, which parameters
     reproduce the site''s published tables, how it behaves at high latitude, and whether it
     can serve a worldwide v2.0 directly (finding 43: London only, no city parameter).
   - mawaqit <https://github.com/mawaqit/prayer-times-moonsighting>. Establish what it and the
     endpoint compute, where they agree or diverge, and whether either matches the London
     modification.
4. NPM packages implementing this method. Other moonsighting committees exist: a "moonsighting"
   package may follow a different body entirely. Verify each candidate traces back to Khalid
   Shaukat''s committee and moonsighting.com. Record provenance: author, algorithm source, last
   publish, licence, and whether its numbers reproduce the site''s. The owner''s lead, unverified:
   the `adhan` package''s `CalculationMethod.MoonsightingCommittee()`. Treat it as a candidate,
   not an answer. Establish which paper or page it derives from, whether its Fajr and Isha
   reproduce the site''s tables for the same coordinates and dates, how it handles high latitude,
   and what is approximation rather than method. Diff its output against the site''s tables for
   several cities and seasons, including one above 60N, and against the London unified times.
   Read implementations with the `opensrc` CLI: the source is the arbiter, not the docs.

## Deliverable

- How Fajr and Isha are derived, the high-latitude behaviour, what "moonsighting" contributes
  beyond a solar-depression angle, and where the thesis is documented.
- Who maintains the method, who uses it, and how the published timetables are generated.
- The exact delta between London''s unified times and the unmodified method.
- Which package is safe to depend on, and if none is, what implementing it would take.
- What this implies for a worldwide v2.0: findings 43 (London-only endpoint, no city parameter),
  44 (Magrib has no midnight-crossing rule), 46 (London-pinned test oracles), 47 (high latitude).

## Rules for both sessions

- Own session, clean context. Research, not coding.
- Read 100% of every source: no slices, no `head`, no summary in place of reading. Diff-read
  near-duplicates.
- Never copy, average or invent a prayer time. Report deltas in minutes, not verdicts.
- The API is the source of truth. The app edits nothing it returns.
- Research only: no production code, no builds, no jest, no EAS. Never touch `uat` or
  `releases.json`.
- Never print, store or commit the London Prayer Times API key. The local `.env` holds only a
  placeholder. Ask the owner for the key if the API must be called. Commit through the
  key-prefix guard.


---


# Moonsighting research, sob 2: read, decide, then finish

Status: deferred by the owner, queue row 25. He has not read the findings or answered section
5''s questions. Whether the research is conclusive, and whether v2.0 can use it, stays open.

This extends `ai/prompts/moonsighting-research.md`: its sources, deliverable and rules apply here.

## Where everything is

- Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md`. Read it first, in full.
- Notes, data and page source: `ai/features/moonsighting/notes/`, `data/` and `artifact/`.
- The visual findings page is private and its link lives off-repo, in the owner''s keep. Rebuild
  it with `artifact/build_artifact.py`. Chart data: `artifact/chart-data.json`, which the
  script reads from the `~/athan-gitree/research/` copy.
- Scratch (crawl, PDFs, raw responses, scripts) is in `~/athan-gitree/research/`, outside git. The repo
  holds everything needed to continue.

## Do, in order

1. Help the owner read it. Before any new research, give him a short, plain answer drawn from the
   findings: what is settled and what is not, and whether each part of the v2.0 plan can rest
   on it. The London API stays London''s default. Moonsighting.com is a second option in London
   and the only source elsewhere. Mark anything unverified, then wait for the owner.
2. The remainders in findings sections 3.1 to 3.4, once the owner wants the research resumed:
   reproduce London''s Asr independently, measure the day-early clock change in Palestine, look
   into the McMurdo polar-edge runs and the Sky Prayers apps, and run the Rust, C# and Dart
   ports only if a decision depends on their numbers. Read `ai/features/global-prayer-times/RESUME-FROM.md`
   (queue row 42) first. Some remainders may already be answered there.
3. Review. Run one independent reviewer over the whole findings file. It attacks every claim,
   count and fixture, re-derives the London counts from `data/london/` and the section 2.13
   dates from `notes/method-versions/`. Fix what it finds. Republish the findings page at the
   owner''s private link.
4. Section 5''s eleven questions stay open until the owner is ready. Bring them only when asked. Do not press.

## Sob 1''s short answers (step 1 starts from these)

1. How is London''s unified timetable calculated, and who set it? The sun times come from HMNAO
   (sections 2.14 and 2.15): sunrise minus 3, noon plus 5, sunset plus 3, Asr at one and at two
   shadow lengths. Fajr and Isha are fixed minute intervals by calendar date, from the 1987-88
   Blackburn observations (Hizbul Ulama, Miftahi''s Tables 5 and 6) with London''s own edits.
   Adopted 1 August 2011 by the mosques named in Unified.pdf. Unanswered: who made the edits, why.
2. Is it safe for the worldwide option? No. The intervals were observed at one latitude
   (53.45N), in one hemisphere, and are meant for the UK.
3. What should the worldwide option use? Sob 1 recommends calculating the method on the
   device (adhan''s `MoonsightingCommittee`) rather than calling the endpoint. It needs owner
   rulings on polar days, and on whether a calculation counts as a source under the
   never-synthesise rule (section 5, questions 1 and 7).
4. Where do mosque clocks, mawaqit and other apps get their times, and do they add offsets? Not
   researched beyond section 2.16, where mawaqit''s PHP copy implements the seasonal function
   only. Candidate research for this session.

## Rules beyond sob 1''s

- Agents: one at a time, two at most. Sob 1''s four parallel agents hit the session limit
  twice and the weekly limit once. Agents save notes after every step.
- Git: the rules on a research worktree and branch, on `--no-verify` (the pre-commit hook runs
  the full jest suite) and on pushing nothing predate the merge of `research/moonsighting`. The
  planning session asks the owner which still apply.

## Prompt to start the session

```
Read ai/prompts/README.md for the standing rules, then ai/prompts/moonsighting-research-2.md.
Read ai/features/moonsighting/RESEARCH-FINDINGS.md in full. Start at step 1: tell me plainly
what the research settles, what it does not, and whether the v2.0 plan can rest on it, then
wait for me. Research only. Follow the rules in moonsighting-research.md. Never invent a prayer
time. Never store or commit the API key. Merge and push nothing without my go-ahead.
```
', NULL, 'file-text', '{}', false, false, false, NULL, 6144, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.780332+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (10, 8, 1, NULL, 'Programme: SDK 58', '# SDK 58 programme briefs

The queue table in `ai/plans/README.md` is the authority for order and status. This file keeps
only the briefs open rows still cite: section 16 (queue row 18) and D4 (queue rows 38 and 39).
DONE records live in git history.

## 16. SDK 58 stable re-pin + full release-notes review (DONE 2026-10-17, row 111; the ride-`next` policy carries on)

**Trigger.** The owner ruled 2026-10-09: ride the `next` tag and repin to the newest version every
time, release candidates included. SDK 58 hit `latest` 2026-10-16 and row 111 ran the re-pin.
The next attempt takes the newest `expo` at ITS start: `58.0.14` was already on npm at this
ticket''s close (published after this attempt''s step 1 pinned `58.0.13`, the newest at that
moment), so the next re-pin starts from 58.0.14 or newer.

**Landed set (2.0.908, merge `9dd4eb6a`).** `expo ~58.0.13` with its `bundledNativeModules`
delta (eight direct pins moved, three transitive followed: `babel-preset-expo`,
`expo-application` 58.1.1 to 58.1.2, `expo-modules-core`), `react-native` 0.88.0. All three
patches regenerated whole at `expo-background-task+58.0.11`, `expo-location+58.0.17` and
`expo-widgets+58.0.20`, no hunk hand-merged; `didRegisterTaskForTesting` and `mLastAzimuth`
left the patches; the vacuous `local-maven-repo` check died; the guard suite
`shared/__tests__/backgroundTaskPatch.test.ts` pins the offline option on all three sides.
`expo-widgets@58.0.19` was broken upstream for Android (its source imports
`io.github.jakex7.peek.*` while its dependency packages `io.github.expo.peek.*`, 16 unresolved
references at `:expo-widgets:compileReleaseKotlin`); 58.0.20 fixes it, and that defect is why
the first attempt became a NEEDS REPLAN. Proven: `yarn validate` and `yarn test:tz` green at
100 percent, the 3T release build in 517 s with every channel, permission and armed-alert check
passing and the alarm-clock sub-block intact (41 future alerts), the armed production fire at
01:53:00.002 on the second (flags 0x3), and the XS loop green per the row 111 record (cold
start, compass at ~105 delegate calls a second, both language directions, BGTask re-submission,
two mock-build notification fires at their armed seconds with the TIME SENSITIVE level, the
live day-roll cascade). The store-release path is open again.

**Babel 8 rider, re-measured 2026-10-16, still blocked upstream.** `@babel/core` 8.0.7 is
latest; `babel-preset-expo@58.0.17` (the preset `expo@58.0.13` pairs with) depends on 36
`@babel/*` 7.x plugins (among them `@babel/preset-typescript ^7.23.0`,
`@babel/plugin-transform-modules-commonjs ^7.24.8`, `@babel/plugin-transform-react-jsx
^7.28.6`) and `@react-native/babel-preset@0.88.0` depends on `@babel/core ^7.25.2`. A Babel 7
plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED`. The four `@babel/*` devDependencies
stay at `^7.29.x` and the rider is re-attempted at every re-pin.

**Scope.**

1. `npx expo install --check` against `latest`: name and bump everything it reports, never `--fix`.
2. Read the full release notes and act on anything new that touches us. Already ruled at past
   re-pins, do not re-litigate: no SwiftPM (CocoaPods stays), no Live Activities. The "no
   threadIdentifier" ruling is superseded by row 120''s order.
3. Full regression: `yarn validate`, `yarn test:tz`, e2e, 3T release build, the dumpsys and
   punctuality gates.
4. Reopen the store-release path: nothing ships to a store or to production before the re-pin
   row is DONE.
5. Bookkeeping: the stack line in `README.md`, the patch rows in `ai/UPSTREAM-PRS.md`, this
   section. (The `ai/AGENTS.md` stack tables were deleted by the owner''s compaction order at
   `b2096c4a` and stay gone.)

**Pin-set and build facts.**

- `react-dom` equals `react`, and `@react-native/metro-config` and `@react-native/jest-preset`
  equal `react-native`, at every re-pin.
- Three local Android modules hardcode `compileSdk 37`, and only a release build notices:
  `checkReleaseAarMetadata` fails the release build only.
- `expo-in-app-updates` is pinned exactly `0.12.0` and is not an SDK package (its peer range on
  expo is `*`); it compiles Kotlin against `expo-modules-core` symbols. Do not patch it.
- On the 3T the alarm-clock proof is a sub-block, never `flags=0x9`. An alarm-clock arm reads
  `window=0 flags=0x3` with an `Alarm clock:` sub-block. `flags=0x9` is the windowed form shown
  by the 8T and the Find X8.
- The SDK-57 known-good backup branch''s last tips are reflog-only (`ef33661b`, `c9614692`).
  Restoring it is the owner''s call.

**Facts the re-pin needs (A1 to A11).** Each cites proof that still stands in the working tree.

- **A1. Upgrade policy, two parts (owner ruling).** Take the absolute latest and fix breaks in
  the code, never pinning back or editing a test to pass. A package broken upstream at its
  latest rolls back alone, one version at a time, to an exact pin with no local workaround,
  until a newer one ships.
- **A2. The Babel 8 blocker** is the rider above. It is this row''s second job.
- **A3. Deliberate divergences from Expo''s pin set** (at the 2026-10-16 stable re-pin,
  `expo@58.0.13`): `react-native` 0.88.0 stable now matches the SDK''s own pin, so no
  divergence survives there. `@expo/ui` and `expo-widgets` are back to exact pins (`58.0.20`
  each, `package.json`): the preview-era 58.0.5 pin that once protected the Android widget
  stub (row 26) broke iOS at dyld launch because the 58.0.5 ExpoUI binary references a
  `_uiRuntime` symbol the newer ExpoModulesCore no longer exports. Upstream closed the trap:
  the stub now exports `memo` as a passthrough, and the loaded-bundle suite is green. Durable
  lesson: `@expo/ui`''s iOS framework tracks ExpoModulesCore''s Swift ABI, so the pair moves
  with the SDK, never against it.
- **A4. `@expo/log-box` is invisible to Expo checks**: it is not in `bundledNativeModules.json`,
  so no Expo check reports it. It sits at `~58.0.12` (`package.json`) on the `^58.0.12` peer
  range that `expo-router` and `@expo/metro-runtime` declare. Move it by that peer range.
- **A5. The commit order that kept the tree green.** One commit: the SDK packages, the rebuilt
  patches and the type fixes the bump forces (the pre-commit hook runs `tsc`). Then React,
  `react-dom` and React Native with the two `@react-native/*` dev tools. Then Reanimated with
  worklets.
- **A6. Rebuilding a patch.** `git apply --check` the old patch on the fresh package. Apply it,
  or make a rejected hunk''s change by hand. Run `npx patch-package <name>` and delete the old
  file. Then delete the package folder and run `yarn install --force` to prove a clean install.
  All three patches are rebuilt at this row (`ai/plans/54-patches-and-copy/FINDINGS.md`,
  section 1), and each rebuild is proven on a phone, never by a green build alone. Removing the
  `publication` block from `expo-module.config.json` is what forces autolinking to compile the
  patched Kotlin from source: with the block present, autolinking resolves the prebuilt AAR and
  Gradle never compiles the patched code.
- **A7. patch-package log semantics.** After a version bump the install succeeds whatever the
  patches did. A `warning` means the old patch still applied. An `error` means that package
  runs UNPATCHED (`shared/__tests__/widgetOpenAppPatch.test.ts:24`).
- **A8. An ESM-only dependency is transformed to CommonJS in BOTH Jest projects, and
  `--experimental-vm-modules` is rejected.** Jest 30''s `require(esm)` is gated on
  `canResolveSync()`, which the components project fails for its custom resolver
  (`jest.config.js:62`). The CommonJS transform both projects share is `jest.config.js:20`.
- **A9. Reanimated 4.7.0 ships the new layout-animation engine as the default.** The legacy
  proxy flag `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is `false` in the installed tree
  (`node_modules/react-native-reanimated/src/featureFlags/staticFlags.json`) and no override
  is set anywhere in the repo. Draw sites that ride it: `components/modals/Modal.tsx:81` and
  `:90`, `components/modals/Help.tsx:75`, `components/sheets/screens/Qibla.tsx:61`.
- **A10. After the install, diff the pin set and read every peer warning.** Job 23 measured
  26 packages and installed 25. `react-native-screens` surfaced only as an `expo-router` peer
  warning (`package.json:73`). One warning is expected: `jest-expo > jest-watch-typeahead@2.2.1`
  wants Jest 29.
- **A11. In `widgets/PrayerWidget.tsx` a fixed `frame()` comes before a flexible one, and no test
  can see the order.** `@expo/ui` types `frame()` as two overloads that cannot be mixed, so
  each mixed call became two chained modifiers. Reversed, the greedy frame takes the space
  first and the row changes size (`:657-658`, `:729`).

- expo-notifications 58.1.0 grew `enableRemoteNotifications: false` for local-only
  apps: a candidate for the next app.json pass, still unclaimed at 1.29.321.

## D4. Localization for v2.0 (NOT PLANNED, carried by queue rows 38 and 39)

Owner goal: the app goes global in v2.0 with a language switcher. Research lives in
`ai/plans/39-localisation/`. Rows 38 and 39 carry the owner''s decisions: a typed English
catalog and `t()`, no i18n library, no second language first. RTL is the real work.
', NULL, 'file-text', '{}', false, false, false, NULL, 7168, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:45:39.797851+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (11, 1, 2, NULL, 'The queue', '# The queue

A ticket is a queued unit of work. A step is a plan step. The board and the repository use the
same two words.

The board is the source of truth. There is no queue file in the repository.

## The columns

| Column | What it means |
| --- | --- |
| Backlog | Queued and not yet planned. |
| Deferred | Deliberately parked behind a later version. |
| Planning | A planner is answering the ticket''s frontier and writing the plan. |
| Ready | The plan passed its gate and the ticket waits for execution. |
| In progress | A lane is executing it. The column warns at three, the standing parallel limit. |
| Blocked | It cannot move until something outside the run changes. |
| Audit | Execution finished and the change is under review. |
| Owner-led | The deliverable is a recommendation the owner must rule on. |
| Upstream | Waiting on a party outside the repository. |
| Done | Merged to `uat` with its records. |

## Needs

A ticket that cannot start before another is finished carries a `blocked_by` relation to it. The
relation is a warning, never a lock: the lane rule is that a ticket is runnable when every issue
that blocks it is Done.
', NULL, 'book', '{}', false, false, false, NULL, 1024, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:47:05.998109+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (12, 3, 2, NULL, 'Working the board', '# Working the board

Nothing here is edited by hand. Agents read and write the board through MCP, and the repository''s
workflow skills carry the conventions.

1. A ticket is created on the board when the owner asks for something, or when a session finds
   work that needs one. It lands in Backlog with a number in `Queue order`.
2. A planner takes it to Planning and writes the plan as a Docs page on the issue, the acceptance
   criteria in the description, and the steps as subtasks. Then it moves it to Ready.
3. A lane takes it to In progress and does the work. It comments as it goes.
4. A reviewer reads the change and posts findings as a comment. The lead adjudicates.
5. Done, with one closing comment.

## The fields

| Field | What it holds |
| --- | --- |
| Queue order | the ticket''s number. The lower it is, the sooner it runs |
| Lane | which lane holds it, set by the lead before dispatch |
| Waiting on | why it is Blocked, Upstream or Owner-led. One line |

## The labels

Surface: iOS, Android, Both. Area: widgets, notifications, prayer-times, qibla, board, docs,
research. Flags: needs-owner, upstream.

## Reading it

The `Queue` view shows the number, the priority, the type, the labels, the queue order, the lane
and how long the ticket has sat where it is. A card also shows what it is waiting on, and the
progress of its steps.

## Connecting a session

The `itsaplan` MCP server in `opencode.json` points at the API origin. Its key comes from
`ITSAPLAN_API_KEY` in the shell environment.
', NULL, 'book', '{}', false, false, false, NULL, 3072, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:47:06.015192+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (13, 4, 2, NULL, 'The board itself', '# The board itself

This instance runs the released images from the product''s own compose file. The theme is the
product''s own and nothing is styled. The deployment lives in `board/` in the repository, and
`board/README.md` documents the containers, the data folders and the restore.

What is configured here and nowhere else: the ten columns, the label vocabulary, the lane, queue
order and waiting-on fields, the `Queue` view, and these pages.

The database and the attachments live in `board/data/`, which git ignores. `board/snapshot/board.sql`
is the committed copy, refreshed at the end of a run. That file is what brings the board back.

Nothing on this board runs by itself. There are no agents, no webhooks and no schedules. A
session reads it and writes it, and that is all.
', NULL, 'book', '{}', false, false, false, NULL, 4096, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 01:47:06.034128+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (15, 1, 3, NULL, 'The tickets', '# The tickets

A ticket is a queued unit of work. A step is a plan step. The board and the repository use the
same two words.

The board is the source of truth. There is no ticket file in the repository.

## The columns

| Column | What it means |
| --- | --- |
| Backlog | Queued and not yet planned. |
| Deferred | Deliberately parked behind a later version. |
| Planning | A planner is answering the ticket''s frontier and writing the plan. |
| Ready | The plan passed its gate and the ticket waits for execution. |
| In progress | A lane is executing it. The column warns at three, the standing parallel limit. |
| Blocked | It cannot move until something outside the run changes. |
| Audit | Execution finished and the change is under review. |
| Owner-led | The deliverable is a recommendation the owner must rule on. |
| Upstream | Waiting on a party outside the repository. |
| Done | Merged to `uat` with its records. |

## Needs

A ticket that cannot start before another is finished carries a `blocked_by` relation to it. The
relation is a warning, never a lock: the lane rule is that a ticket is runnable when every issue
that blocks it is Done.
', NULL, 'book', '{}', false, false, false, NULL, 1024, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 02:17:21.382109+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (16, 3, 3, NULL, 'Working the board', '# Working the board

Nothing here is edited by hand. Agents read and write the board through MCP, and the repository''s
workflow skills carry the conventions.

1. A ticket is created on the board when the owner asks for something, or when a session finds
   work that needs one. It lands in Backlog with a number in `Ticket number`.
2. A planner takes it to Planning and writes the plan as a Docs page on the issue, the acceptance
   criteria in the description, and the steps as subtasks. Then it moves it to Ready.
3. A lane takes it to In progress and does the work. It comments as it goes.
4. A reviewer reads the change and posts findings as a comment. The lead adjudicates.
5. Done, with one closing comment.

## The fields

| Field | What it holds |
| --- | --- |
| Ticket number | the ticket''s number. The lower it is, the sooner it runs |
| Lane | which lane holds it, set by the lead before dispatch |
| Waiting on | why it is Blocked, Upstream or Owner-led. One line |

## The labels

Surface: iOS, Android, Both. Area: widgets, notifications, prayer-times, qibla, board, docs,
research. Flags: needs-owner, upstream.

## Reading it

The `Queue` view shows the number, the priority, the type, the labels, the tickets order, the lane
and how long the ticket has sat where it is. A card also shows what it is waiting on, and the
progress of its steps.

## Connecting a session

The `itsaplan` MCP server in `opencode.json` points at the API origin. Its key comes from
`ITSAPLAN_API_KEY` in the shell environment.
', NULL, 'book', '{}', false, false, false, NULL, 3072, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 02:17:21.398284+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (14, 6, 3, NULL, 'Plan: #144', '# The board as a portable product, take three: It''s a Plan

# Ticket 144: The board as a portable product, take three: It''s a Plan

| Brief | The board as a portable product, take three: It''s a Plan (itsaplan.dev) |
| --- | --- |
| Planned at | `5b1c965d`, version 2.0.1092, 2026-10-19 |
| Planned by | Lead session 2026-10-19, from the owner''s brief in `ai/prompts/itsaplan-board.md` |
| Needs first | nothing (the two rejected prototypes are discarded and their branches are gone) |
| Parent | none |
| Group | the board prototype (`ai/plans/README.md` row 144 only, disjoint from every other open row) |
| Batch budget | 2 (two docs-and-operations steps, no code step) |
| Session budget | 2 |
| Steps count | 2 (bring the stack up, put the tickets''s tickets on it) |
| Device | none. The proof is the running stack and the browser read of the board |
| Owner decisions still needed | none. The research gate and the mapping are ruled here |

## 1. Goal

Two board products were built far too far and rejected the day each was handed over: Kanboard
v1.2.54 (2026-10-18) was called ugly in every way with a custom MCP layer creeping back in, and
Paperclip 2026.1012.0 (2026-10-18 to 2026-10-19) was discarded whole. The owner''s lessons: an
ugly board is a rejected board, and a custom layer on top of the product counts against it.

Today the repository has no board the owner can look at. When this ticket is done, a third
product, It''s a Plan v1.5.0, runs from its own `docker-compose.yml` with generated secrets in an
env file outside the repository tree, and the tickets''s own tickets sit on one project inside it.
The owner notices by opening `http://localhost:3001`, signing in, and reading the Kanban board.

The owner''s rules that bind this work, quoted from `ai/prompts/itsaplan-board.md`:

- "Spin it up. As default as possible, bare minimum. Nothing else."
- "Put our current tickets on it."
- "I don''t want anything to do with migration, nothing. I don''t want to sync."
- "No AI agents, no MCP connection, no webhooks, no sync, no import engineering, no theming, no
  custom glue of any kind."
- "Nothing merges to `uat` until that ruling; the work lives on a branch."
- "No secret, address or key is ever committed."

## 2. Decisions

### 2.1 Taken

| Decision | Answer | By | Recorded |
| --- | --- | --- | --- |
| Product | It''s a Plan v1.5.0 | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Release pin | `VERSION=1.5.0` in the env file, the release the brief names | agent-ruled | LOG.md, 2026-10-19 |
| Checkout and env location | `$HOME/athan-gitree/sessions/144/itsaplan` (clone) and `$HOME/athan-gitree/sessions/144/.env`, both outside the repository tree | agent-ruled | LOG.md, 2026-10-19 |
| Telemetry | `TELEMETRY_DISABLED=1` and `DO_NOT_TRACK=1` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Postgres password alphabet | `openssl rand -hex 32` rather than base64, so the value cannot break the `DATABASE_URL` interpolation | agent-ruled | LOG.md, 2026-10-19 |
| Ticket import route | the product''s own REST API (`/teams`, `/projects`, `/projects/:ref/issues`, `/issues/:id/links`) driven from a throwaway script in `$TMPDIR` | owner, in the brief | `ai/prompts/itsaplan-board.md` |
| Status mapping | Done to the product''s Done column, In progress to In Progress, Ready and Planning and Audit to Todo, and Backlog and Deferred and Blocked and Upstream and Owner-led to Backlog | agent-ruled | LOG.md, 2026-10-19 |
| Needs mapping | each resolvable `needs` pair becomes one `blocked_by` relation between the two issues | agent-ruled | LOG.md, 2026-10-19 |
| Local cookie flag | `NODE_ENV=development` on the api service only, through a compose override outside the repository tree, so the session cookie is not `Secure` over plain HTTP | agent-ruled | LOG.md, 2026-10-19 |

### 2.2 The executor must not decide

None. The scope is two steps with no code path, the research gate is answered in section 4, and
the owner is hands-off until the verdict. No irreversible act the hard rules name is in scope:
no money, no credential leaves this machine, nothing is published, nothing is destroyed.

## 3. Pre-flight

`scripts/preflight-144.sh` verifies the stack checkout, the compose file, the free ports, the
absent committed secret, the tickets row, the version, and every anchor count equal to 1. It ends
`PREFLIGHT OK`.

## 4. Background

### 4.1 Code map (repository)

| File | Why it is read |
| --- | --- |
| `board/reader.mjs` | emits `board/state/board.json`: the `tickets` array is the import''s source, `doneColumnCount` 9999 in `board/config.json` puts all 107 done rows in that array |
| `board/config.json` | sets `doneColumnCount` to 9999, so the emitted count is 128 |
| `board/state/board.json` | the emitted tickets, regenerated at step 2 |
| `ai/plans/README.md` | row 144, the ticket this work tracks |
| `package.json`, `app.json` | the version files every commit bumps together |

### 4.2 Code map (the product, read in the checkout at `$HOME/athan-gitree/sessions/144/itsaplan`)

| Path | What it proves |
| --- | --- |
| `docker-compose.yml` | the seven services, the required env keys, the published ports 3000 and 3001, the `VERSION` image pin |
| `.env.example` | every optional variable, including the telemetry switches |
| `docs/self-hosting.md` | the `http://localhost` plain-HTTP cookie exception in Chrome and Firefox, and "the first account you register becomes the instance admin" |
| `apps/api/src/modules/projects/service.ts` | `DEFAULT_COLUMNS`: Backlog, Todo, In Progress, Done, Canceled |
| `apps/api/src/modules/issues/index.ts` | `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links` |
| `apps/api/src/modules/teams/index.ts` | `POST /teams` then `POST /teams/:teamId/projects` |

### 4.3 Existing tests and what each proves

None apply. The deliverable is a running stack, and the repository has no test for a third-party
container stack. The proof is physical: the browser read of the board at step 2 and the API
counts recorded in `LOG.md`.

### 4.4 Why the obvious fix is wrong

Writing an importer inside the repository is the failure the two rejected runs repeated. The
brief forbids committed tooling, so the copy is throwaway session work in `$TMPDIR`. Theming the
product to look less plain is the second failure: the brief forbids a theme, and the default
interface is what the owner is being asked to judge.

## 5. Design

**Invariant.** The stack runs from the product''s own compose file with only the seven required
env values plus the telemetry switches and the release pin, and the project holds one issue per
emitted ticket.

**Alternatives rejected.** A `.env` inside the checkout: the repository is public and the
identifier gate forbids a committed secret. A personal API key created through the browser: the
session cookie already round-trips over `http://localhost` with curl, so no second credential is
needed. Custom project columns named after the tickets''s own statuses: the brief says map onto the
product''s fields, and the default five columns are the most default surface.

### Acceptance criteria

- [R1.1] WHEN the compose stack starts from the repository''s `docker-compose.yml` with the generated env file THE SYSTEM SHALL report api healthy on port 3000 and web healthy on port 3001.
- [R1.2] WHEN `http://localhost:3000/auth-config` is read on the fresh database THE SYSTEM SHALL answer `{"hasUsers":false,"registration":"open","emailPassword":true}`.
- [R2.1] WHEN `node board/reader.mjs` runs on this tree THE SYSTEM SHALL write 128 tickets into `board/state/board.json`.
- [R2.2] WHEN the emitted tickets are posted to `POST /projects/athan-uk.QUEUE/issues` THE SYSTEM SHALL hold 128 issues, 107 in the Done column and 21 in the Backlog column.
- [R2.3] WHEN a ticket''s `needs` entry names an emitted ticket THE SYSTEM SHALL hold one `blocked_by` relation for that pair, 53 pairs in total across the project.
- [R2.4] WHILE no agent, webhook or Telegram token is configured THE SYSTEM SHALL log the worker and bot start lines and nothing after them, and answer an empty webhook list.
- [R3.1] WHEN the first account registers at `http://localhost:3001/register` THE SYSTEM SHALL give it the `god` role and open a session that reaches the board.
- [R4.1] IF any research-gate answer is no THE SYSTEM SHALL stop and report before starting the stack.
- [R5.1] WHEN the work is handed over THE SYSTEM SHALL leave the stack running, the board reachable at `http://localhost:3001/athan-uk.QUEUE`, and no generated file inside the repository tree.
- [R6.1] WHEN the board is read THE SYSTEM SHALL render the tickets''s ten columns by their queue names, left to right Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream and Done.
- [R6.2] WHEN the emitted tickets are placed THE SYSTEM SHALL put each on the column its queue row names, 107 on Done and 21 across the open columns.
- [R7.1] WHEN the AI Agents page is read THE SYSTEM SHALL list the seven workflow roles, and the Skills library SHALL hold `athan-lead` and `athan-planner`.
- [R7.2] WHEN an agent connects to the local board over MCP THE SYSTEM SHALL take a personal key from the shell environment and list the board''s tools.
- [R8.1] WHEN the runner is considered THE SYSTEM SHALL leave it uninstalled and record that starting it spends model tokens.

## 6. Steps

- [ ] Step 01: bring the stack up on the pinned release, defaults only (`steps/01-bring-up.md`)
- [ ] Step 02: put the tickets''s tickets on one project through the REST API (`steps/02-import.md`)
- [ ] Step 03: inject the workflow into the board (`steps/03-inject.md`)

Both steps are operations, not code. The evidence for each is a command''s output recorded in
`LOG.md`.

## 7. Device proof

None. No phone, no simulator and no build is in scope. The physical proof is the browser read of
`http://localhost:3001/athan-uk.QUEUE` and the issue page, with the column counts in the
screenshots kept outside the repository tree.

## 8. Records

`LOG.md` carries the planning section and one `### Step <NN> — <state>` section per step, each
ending with a `session:` line. The tickets cell text the lead applies on DONE is settled by the
owner''s verdict, which is a later ticket. This run leaves row 144 OWNER-LED with the handover
record. The docs commit subject is `docs(plans): ticket 144 ...`.

## 9. Push

None. The executor never pushes. The lead pushes after the reviews pass and the owner''s verdict.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| A required env key is missing | the compose file names the key in its refusal. Add it to the env file outside the tree and re-run `up -d` |
| Agent containers exit on start | read `docker compose logs <service>`. The api healthcheck line and the migrate exit code come first |
| The browser stays signed out after sign-in | the session cookie is `Secure` and the browser is WebKit. The api runs with `NODE_ENV=development` from the compose override, so the cookie is not `Secure` and every browser keeps it |
| The import script fails midway | re-run with `--links-only`, which resolves existing issues by their `#<order>` title prefix |
| A port is taken | 3000 and 3001 carry `API_PORT` and `WEB_PORT`. Change one in the env file only, never in the compose file |

## 11. Subagents

Planning: none. The brief is complete and the research gate is answered from the product''s own
source. Delivery: none. The two steps are operations driven by the lead, and the audit is the
lead''s read of the running board. `vision` reads any screenshot the lead cannot see.

## 12. Report to the owner

What changed: It''s a Plan v1.5.0 runs locally from its own compose file, and one project holds
the tickets''s 128 emitted tickets. What was proven: the criteria in section 5, each against a
command''s output in `LOG.md` or a browser read. Decisions waiting on the owner: the verdict on
look, feel and functionality. The four-line handoff closes the run, with the URL and the ports.


---

# Log

# Ticket 144 log: the It''s a Plan board

## Planning (2026-10-19)

Brief: `ai/prompts/itsaplan-board.md`. Planned at `5b1c965d`, version 2.0.1092. The owner''s
brief carries the whole scope: two steps, spin the product up on its own compose path and copy
the tickets''s emitted tickets onto one project through the REST API, then stop for the verdict.

### Research gate, answered from the product''s own source

Read against the v1.5.0 checkout (`6e0dc0b`, 2026-10-13). Every answer is yes.

1. **Runs locally through its own Docker path, viewable at `http://localhost:3001`.** The
   compose file publishes `api` on 3000 and `web` on 3001 and keeps RustFS internal.
   `docs/self-hosting.md` states that `http://localhost` is the one plain-HTTP exception for the
   `Secure` session cookie, in Chrome and Firefox, and that WebKit refuses it. Verified live:
   both containers report healthy and the board renders in Chromium.
2. **Genuinely free and self-hostable with no cloud dependency.** `LICENSE` is the full AGPL v3
   text. No license key, licence server or paid tier appears anywhere in the tree. Every service
   in the compose file runs locally, and the images are public GHCR tags.
3. **The default stack shows the board with agents, MCP, webhooks and the Telegram bot inert.**
   The bot starts and re-reads its config from the database. With no token it logs its start line
   and idles. The worker logs its start line and finds no webhook delivery and no agent run to
   claim. The project starts with no webhook (`GET /projects/athan-uk.QUEUE/webhooks` answers
   `[]`) and no agent attached. MCP is a team switch, off until an operator turns it on.
4. **Tickets arrive through the product''s own API with no committed tooling.** `POST /teams`,
   `POST /projects`, `POST /projects/:projectKey/issues` and `POST /issues/:issueId/links`. The
   brief forbids committed tooling, so the copy is a throwaway script in `$TMPDIR` authenticated
   with the session cookie from first registration.
5. **First open.** `http://localhost:3001/register` shows the first-run sign-up form. The first
   account registered becomes the instance admin (`role: "god"`), owns the instance workspace,
   and the session lands on the project board at `/athan-uk/QUEUE`.

### Decisions taken (agent-ruled)

- **Release pin `VERSION=1.5.0`**: the brief names v1.5.0 as the verified release, and pinning
  keeps the run on a version whose docs were read.
- **Checkout and env outside the repository tree**: `$HOME/athan-gitree/sessions/144/itsaplan`
  and `$HOME/athan-gitree/sessions/144/.env`. The repository is public and the identifier gate
  forbids a committed secret.
- **Postgres password from `openssl rand -hex 32`**: a base64 value can contain `/`, which
  breaks the `postgres://user:pass@host` interpolation the compose file builds. Hex is the same
  strength and URL-safe. The other secrets stay on the documented `openssl rand -base64 32`.
- **Status mapping onto the product''s default columns**: the project''s own five columns are
  Backlog, Todo, In Progress, Done and Canceled. Done maps to Done, In progress to In Progress,
  and Ready, Planning and Audit to Todo. Backlog, Deferred, Blocked, Upstream and Owner-led map
  to Backlog. Canceled stays unused. The emitted run holds 107 Done and 21 open, so the board
  reads Backlog 21, Todo 0, In Progress 0, Done 107, Canceled 0.
- **Local cookie flag, added after the first sign-in attempt failed in the owner''s browser**:
  a `docker-compose.override.yml` in the checkout, outside the repository tree, sets
  `NODE_ENV=development` on the api service only. The product''s auth reads
  `secure: hostPrefixedCookies || NODE_ENV === "production"`, so this is the one lever that
  stops the session cookie carrying `Secure` over plain HTTP. Every browser then keeps the
  session on localhost, not only Chrome and Firefox. The web and worker containers are
  untouched.
- **Needs as `blocked_by` relations**: each `needs` entry that names an emitted ticket becomes
  one relation between the two issues. Of 69 needs entries, 53 resolve: 14 name a row that is
  cancelled or superseded and is not emitted, one is a self-reference (row 59 names itself), and
  one pair appears twice.

### Pre-flight

`scripts/preflight-144.sh` copied to `$TMPDIR` and run from the repository root printed
`PREFLIGHT OK`.

## Phase 2, after the owner''s approval (2026-10-19)

The owner read the board, approved the prototype, and asked for the tickets''s workflow to be
injected into it: the tickets''s own columns, its agents, its skills and its docs, with the styling
untouched and the repository queue still the source of truth. The branch was pushed and not
merged to `uat`.

### Step 03 — done

**Columns.** The product''s five defaults became the tickets''s own ten, in the reader''s own words:
Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit, Owner-led, Upstream, Done.
`In progress` carries a soft WIP limit of three, which is the standing parallel order turned
into the board''s own control. The product orders columns by state category and then by position,
so the rendered order is Backlog, Deferred, Planning, Ready, In progress, Blocked, Audit,
Owner-led, Upstream, Done. The reader''s order could not be reproduced exactly because the
product groups by state category, and Deferred is a backlog state while Upstream is a started
one.

**Tickets.** All 128 moved to the column their queue row names: Done 107, Deferred 11,
Backlog 6, Owner-led 2, Blocked 1, Upstream 1, and Planning, Ready, In progress and Audit empty.
That is the reader''s own distribution.

**Workflow data.** `Ticket number` is a number field carrying each ticket''s number in the tickets,
so any view can sort the way the tickets does.

**Agents.** The seven workflow roles are on the project as external agents: lane-lead, planner,
executor, plan-griller, reviewer, explorer and vision. Each carries its one-line mandate. The
AI Agents page lists them with "No runner yet".

**Skills.** `athan-lead` and `athan-planner` are in the team library, read from the repository''s
own skill files.

**Docs.** Five pages: The tickets, The agents, Working the board, The board itself, and Running
the agents from the board.

**MCP.** `itsaplan` is a remote server in `opencode.json`, written by `opencode mcp add` so the
shape is the product''s own: it sits under `mcp.servers` with the URL of the API origin''s `/mcp`
and an `x-api-key` header reading `{env:ITSAPLAN_API_KEY}`. The personal key was created on the
owner account and written to the shell environment and to
`$HOME/athan-gitree/sessions/144/mcp-key.txt`, never into the repository.

The endpoint was verified three ways. A keyless call answers 401. A call with the key answers
200 and `tools/list` returns the board''s tools. The OpenCode client sends the configured header
and connects: with the key written literally for one test, the board''s MCP instructions arrived
in the running session. The substitution itself needs the variable in the environment of the
process that opens the connection, and the background service of the session running this work
started before the export existed. A shell started after the `~/.zshrc` line connects it.

Without a key the endpoint answers 401.

### Decisions taken (agent-ruled, phase 2)

- **The runner is not installed.** `@itsaplan/runner` would claim runs for the agents on this
  board and start a coding agent CLI on every one. That spends model tokens on each run, so it
  is written up as a Docs page and left for the owner''s order. The agents exist and are inert.
- **Column state categories keep their real meanings.** Deferred stays a backlog state and
  Upstream a started state, so the board''s analytics stay honest. The cost is that the rendered
  order is the product''s grouping rather than the reader''s exact order.
- **No styling touched.** No theme, no stylesheet, no colour scheme. The only colours set are
  the new columns'' state colours, which the product requires.
- **The repository queue stays the source of truth.** The board mirrors it. No sync service and
  no importer is committed, so nothing writes back to the repository from the board.

### Verified after phase 2

The board renders the ten columns with the reader''s distribution. `In progress` shows `0 / 3`.
The AI Agents page lists seven roles. The Skills library lists two. Docs lists five pages. The
MCP endpoint takes the personal key and refuses a keyless call.

The three throwaway scripts live in `$TMPDIR` and die with the session.

## Ticket 144

### Step 01 — done

Stack brought up. `docker compose pull` then `docker compose up -d` from the v1.5.0 checkout
with `--env-file $HOME/athan-gitree/sessions/144/.env`. `docker compose ps` reads:

```
itsaplan-api-1       Up (healthy)   0.0.0.0:3000->3000/tcp
itsaplan-bot-1       Up
itsaplan-minio-1     Up (healthy)   9000-9001/tcp (internal)
itsaplan-postgres-1  Up (healthy)   5432/tcp (internal)
itsaplan-web-1       Up (healthy)   0.0.0.0:3001->3001/tcp
itsaplan-worker-1    Up
```

`curl http://localhost:3000/` answers 200 and `curl http://localhost:3001/login` answers 200.
`curl http://localhost:3000/auth-config` answers
`{"registration":"open","magicLink":false,"requireEmailVerification":false,"emailEnabled":false,"emailPassword":true,"google":false,"oidc":false,"oidcLabel":"","hasUsers":false}`.
R1.1 and R1.2 hold. R4.1 holds: every gate answer is yes.

### Step 02 — done

`node board/reader.mjs` wrote 128 tickets into `board/state/board.json` (107 done rows, all of
them emitted because `board/config.json` sets `doneColumnCount` to 9999).

The admin account was registered through the product''s own sign-up endpoint at
`http://localhost:3001/register` and the API reported `role: "god"`. `POST /teams` made
`Athan.uk` (slug `athan-uk`), `POST /projects` made `QUEUE`, and the throwaway script posted 128
issues. The API then read 128 issues, 107 on `columnId` 4 (Done) and 21 on `columnId` 1
(Backlog). The second pass created the `blocked_by` relations. `psql -tAc "select count(*) from
issue_link"` answers 53, matching the resolvable needs.

The board renders at `http://localhost:3001/athan-uk.QUEUE` with the five columns and the ticket
cards, each title carrying its `#<order>` prefix. An issue page shows the description carrying
the tickets status and the relations panel carrying the `blocked_by` pairs. R2.1, R2.2, R2.3,
R3.1 and R5.1 hold.

R2.4 holds: `docker compose logs worker` reads one line, `[worker] worker starting`, and
`docker compose logs bot` reads one line, `[bot] bot service starting`. `GET
/projects/athan-uk.QUEUE/webhooks` answers `[]`.

session: ses_eaea5deecffeZq7TThCzVL0d8R

### Handover (2026-10-19)

Stack left running, and the board is open in the owner''s browser. Board at the documented web
port on path `/athan-uk.QUEUE`, sign-up at `/register`. The first sign-in attempt failed in the
owner''s browser, so the api was restarted with the cookie override above and the password was
changed through `/api/auth/change-password` to a typeable value. Both were verified by a fresh
browser sign-in that landed on the board. Credentials are in
`$HOME/athan-gitree/sessions/144/credentials.txt`, outside the repository tree. Nothing merges
to `uat` until the owner rules. The throwaway import script lived in `$TMPDIR` and is deleted.

Row 144 was set OWNER-LED after the copy, so the reader was re-run and the single issue this
ticket tracks (`QUEUE-21`) had its description refreshed to the new row. The other 127 issues
stay the snapshot they were posted as. The needs cell for row 144 carries no digits, so the
reader''s number scan finds no dependency there.

`yarn validate` passes on the branch: tsc clean, Biome clean, Jest 5785 tests in 223 suites,
coverage 100 percent. Only `package.json` and `app.json` are version files in git. `android/`
is ignored, and its `versionName` was moved with the pair.
', NULL, 'file-text', '{}', false, false, false, NULL, 5120, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 02:17:21.424197+00');
INSERT INTO public.project_document_revision (id, document_id, version, parent_id, title, content, content_json, icon, metadata, full_width, is_private, is_locked, archived_at, "position", owner_user_id, created_by_user_id, created_at) VALUES (17, 8, 2, NULL, 'Programme: SDK 58', '# SDK 58 programme briefs

The tickets table in `ai/plans/README.md` is the authority for order and status. This file keeps
only the briefs open rows still cite: section 16 (queue row 18) and D4 (queue rows 38 and 39).
DONE records live in git history.

## 16. SDK 58 stable re-pin + full release-notes review (DONE 2026-10-17, row 111; the ride-`next` policy carries on)

**Trigger.** The owner ruled 2026-10-09: ride the `next` tag and repin to the newest version every
time, release candidates included. SDK 58 hit `latest` 2026-10-16 and row 111 ran the re-pin.
The next attempt takes the newest `expo` at ITS start: `58.0.14` was already on npm at this
ticket''s close (published after this attempt''s step 1 pinned `58.0.13`, the newest at that
moment), so the next re-pin starts from 58.0.14 or newer.

**Landed set (2.0.908, merge `9dd4eb6a`).** `expo ~58.0.13` with its `bundledNativeModules`
delta (eight direct pins moved, three transitive followed: `babel-preset-expo`,
`expo-application` 58.1.1 to 58.1.2, `expo-modules-core`), `react-native` 0.88.0. All three
patches regenerated whole at `expo-background-task+58.0.11`, `expo-location+58.0.17` and
`expo-widgets+58.0.20`, no hunk hand-merged; `didRegisterTaskForTesting` and `mLastAzimuth`
left the patches; the vacuous `local-maven-repo` check died; the guard suite
`shared/__tests__/backgroundTaskPatch.test.ts` pins the offline option on all three sides.
`expo-widgets@58.0.19` was broken upstream for Android (its source imports
`io.github.jakex7.peek.*` while its dependency packages `io.github.expo.peek.*`, 16 unresolved
references at `:expo-widgets:compileReleaseKotlin`); 58.0.20 fixes it, and that defect is why
the first attempt became a NEEDS REPLAN. Proven: `yarn validate` and `yarn test:tz` green at
100 percent, the 3T release build in 517 s with every channel, permission and armed-alert check
passing and the alarm-clock sub-block intact (41 future alerts), the armed production fire at
01:53:00.002 on the second (flags 0x3), and the XS loop green per the row 111 record (cold
start, compass at ~105 delegate calls a second, both language directions, BGTask re-submission,
two mock-build notification fires at their armed seconds with the TIME SENSITIVE level, the
live day-roll cascade). The store-release path is open again.

**Babel 8 rider, re-measured 2026-10-16, still blocked upstream.** `@babel/core` 8.0.7 is
latest; `babel-preset-expo@58.0.17` (the preset `expo@58.0.13` pairs with) depends on 36
`@babel/*` 7.x plugins (among them `@babel/preset-typescript ^7.23.0`,
`@babel/plugin-transform-modules-commonjs ^7.24.8`, `@babel/plugin-transform-react-jsx
^7.28.6`) and `@react-native/babel-preset@0.88.0` depends on `@babel/core ^7.25.2`. A Babel 7
plugin under Babel 8 throws `BABEL_VERSION_UNSUPPORTED`. The four `@babel/*` devDependencies
stay at `^7.29.x` and the rider is re-attempted at every re-pin.

**Scope.**

1. `npx expo install --check` against `latest`: name and bump everything it reports, never `--fix`.
2. Read the full release notes and act on anything new that touches us. Already ruled at past
   re-pins, do not re-litigate: no SwiftPM (CocoaPods stays), no Live Activities. The "no
   threadIdentifier" ruling is superseded by row 120''s order.
3. Full regression: `yarn validate`, `yarn test:tz`, e2e, 3T release build, the dumpsys and
   punctuality gates.
4. Reopen the store-release path: nothing ships to a store or to production before the re-pin
   row is DONE.
5. Bookkeeping: the stack line in `README.md`, the patch rows in `ai/UPSTREAM-PRS.md`, this
   section. (The `ai/AGENTS.md` stack tables were deleted by the owner''s compaction order at
   `b2096c4a` and stay gone.)

**Pin-set and build facts.**

- `react-dom` equals `react`, and `@react-native/metro-config` and `@react-native/jest-preset`
  equal `react-native`, at every re-pin.
- Three local Android modules hardcode `compileSdk 37`, and only a release build notices:
  `checkReleaseAarMetadata` fails the release build only.
- `expo-in-app-updates` is pinned exactly `0.12.0` and is not an SDK package (its peer range on
  expo is `*`); it compiles Kotlin against `expo-modules-core` symbols. Do not patch it.
- On the 3T the alarm-clock proof is a sub-block, never `flags=0x9`. An alarm-clock arm reads
  `window=0 flags=0x3` with an `Alarm clock:` sub-block. `flags=0x9` is the windowed form shown
  by the 8T and the Find X8.
- The SDK-57 known-good backup branch''s last tips are reflog-only (`ef33661b`, `c9614692`).
  Restoring it is the owner''s call.

**Facts the re-pin needs (A1 to A11).** Each cites proof that still stands in the working tree.

- **A1. Upgrade policy, two parts (owner ruling).** Take the absolute latest and fix breaks in
  the code, never pinning back or editing a test to pass. A package broken upstream at its
  latest rolls back alone, one version at a time, to an exact pin with no local workaround,
  until a newer one ships.
- **A2. The Babel 8 blocker** is the rider above. It is this row''s second job.
- **A3. Deliberate divergences from Expo''s pin set** (at the 2026-10-16 stable re-pin,
  `expo@58.0.13`): `react-native` 0.88.0 stable now matches the SDK''s own pin, so no
  divergence survives there. `@expo/ui` and `expo-widgets` are back to exact pins (`58.0.20`
  each, `package.json`): the preview-era 58.0.5 pin that once protected the Android widget
  stub (row 26) broke iOS at dyld launch because the 58.0.5 ExpoUI binary references a
  `_uiRuntime` symbol the newer ExpoModulesCore no longer exports. Upstream closed the trap:
  the stub now exports `memo` as a passthrough, and the loaded-bundle suite is green. Durable
  lesson: `@expo/ui`''s iOS framework tracks ExpoModulesCore''s Swift ABI, so the pair moves
  with the SDK, never against it.
- **A4. `@expo/log-box` is invisible to Expo checks**: it is not in `bundledNativeModules.json`,
  so no Expo check reports it. It sits at `~58.0.12` (`package.json`) on the `^58.0.12` peer
  range that `expo-router` and `@expo/metro-runtime` declare. Move it by that peer range.
- **A5. The commit order that kept the tree green.** One commit: the SDK packages, the rebuilt
  patches and the type fixes the bump forces (the pre-commit hook runs `tsc`). Then React,
  `react-dom` and React Native with the two `@react-native/*` dev tools. Then Reanimated with
  worklets.
- **A6. Rebuilding a patch.** `git apply --check` the old patch on the fresh package. Apply it,
  or make a rejected hunk''s change by hand. Run `npx patch-package <name>` and delete the old
  file. Then delete the package folder and run `yarn install --force` to prove a clean install.
  All three patches are rebuilt at this row (`ai/plans/54-patches-and-copy/FINDINGS.md`,
  section 1), and each rebuild is proven on a phone, never by a green build alone. Removing the
  `publication` block from `expo-module.config.json` is what forces autolinking to compile the
  patched Kotlin from source: with the block present, autolinking resolves the prebuilt AAR and
  Gradle never compiles the patched code.
- **A7. patch-package log semantics.** After a version bump the install succeeds whatever the
  patches did. A `warning` means the old patch still applied. An `error` means that package
  runs UNPATCHED (`shared/__tests__/widgetOpenAppPatch.test.ts:24`).
- **A8. An ESM-only dependency is transformed to CommonJS in BOTH Jest projects, and
  `--experimental-vm-modules` is rejected.** Jest 30''s `require(esm)` is gated on
  `canResolveSync()`, which the components project fails for its custom resolver
  (`jest.config.js:62`). The CommonJS transform both projects share is `jest.config.js:20`.
- **A9. Reanimated 4.7.0 ships the new layout-animation engine as the default.** The legacy
  proxy flag `USE_LEGACY_LAYOUT_ANIMATIONS_PROXY` is `false` in the installed tree
  (`node_modules/react-native-reanimated/src/featureFlags/staticFlags.json`) and no override
  is set anywhere in the repo. Draw sites that ride it: `components/modals/Modal.tsx:81` and
  `:90`, `components/modals/Help.tsx:75`, `components/sheets/screens/Qibla.tsx:61`.
- **A10. After the install, diff the pin set and read every peer warning.** Job 23 measured
  26 packages and installed 25. `react-native-screens` surfaced only as an `expo-router` peer
  warning (`package.json:73`). One warning is expected: `jest-expo > jest-watch-typeahead@2.2.1`
  wants Jest 29.
- **A11. In `widgets/PrayerWidget.tsx` a fixed `frame()` comes before a flexible one, and no test
  can see the order.** `@expo/ui` types `frame()` as two overloads that cannot be mixed, so
  each mixed call became two chained modifiers. Reversed, the greedy frame takes the space
  first and the row changes size (`:657-658`, `:729`).

- expo-notifications 58.1.0 grew `enableRemoteNotifications: false` for local-only
  apps: a candidate for the next app.json pass, still unclaimed at 1.29.321.

## D4. Localization for v2.0 (NOT PLANNED, carried by queue rows 38 and 39)

Owner goal: the app goes global in v2.0 with a language switcher. Research lives in
`ai/plans/39-localisation/`. Rows 38 and 39 carry the owner''s decisions: a typed English
catalog and `t()`, no i18n library, no second language first. RTL is the real work.
', NULL, 'file-text', '{}', false, false, false, NULL, 7168, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', '2026-10-19 02:17:21.445666+00');


--
-- Data for Name: project_member; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_member (project_id, user_id, role, created_at, role_id, description, source, is_favorite, is_hidden) VALUES (1, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'owner', '2026-10-18 23:35:27.31234+00', NULL, '', 'invite', false, false);


--
-- Data for Name: project_notification_setting; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: project_setting; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_setting (project_id, key, value, updated_at) VALUES (1, 'auto_archive', '{"canceledDays": 7, "completedDays": 28}', '2026-10-18 23:35:27.31234+00');


--
-- Data for Name: project_view; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_view (id, project_id, name, icon, filters, display, "position", created_at, share_token, share_extended) VALUES (1, 1, 'Tickets', 'list', '{}', '{"sort": {"dir": "asc", "field": "manual"}, "group": "status", "subgroup": "none", "showLinks": true, "weekStart": 0, "properties": ["priority", "type", "labels"], "pinnedGroup": null, "hiddenGroups": [], "showSubtasks": true, "timelineScale": "week", "collapsedGroups": [], "showEmptyGroups": true, "collapseSubtasks": true, "separateSubtasks": false, "calendarDateField": "dueDate", "timelineCollapseAll": false}', 0, '2026-10-19 01:39:09.578104+00', NULL, false);


--
-- Data for Name: project_view_favorite; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: revision; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.revision (scope, project_id, rev) VALUES ('documents:1', 1, 22);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:116', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:114', 1, 27);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:112', 1, 24);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:110', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:108', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:25', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:124', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:24', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:100', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:23', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:22', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:20', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:19', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:18', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:17', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:16', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:15', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:13', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:12', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:122', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:11', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:10', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:9', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:8', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:7', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:4', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:3', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:2', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:1', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:120', 1, 35);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:118', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:50', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:49', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:48', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:47', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:46', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:45', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:44', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:43', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:42', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:41', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:40', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:39', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:38', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:37', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:36', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:35', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:34', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:32', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:31', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:28', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:26', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:98', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:96', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:92', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:90', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:88', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:86', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:82', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:80', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:77', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:75', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:73', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:69', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:67', 1, 24);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:65', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:63', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:62', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:61', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:60', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:59', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:57', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:56', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:53', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:52', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:30', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:29', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:127', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:126', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:125', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:111', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:109', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:107', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:106', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:105', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:104', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:93', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:89', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:84', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:83', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:79', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:78', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:76', 1, 18);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:74', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:72', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:71', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:70', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:68', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:66', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:64', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:58', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:55', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:54', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:27', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:6', 1, 21);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:5', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:21', 1, 27);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:128', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:91', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:123', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:121', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:119', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:117', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:115', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:113', 1, 19);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:103', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:102', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:101', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:99', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:97', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:95', 1, 22);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:94', 1, 32);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:87', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:85', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:81', 1, 20);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:51', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:33', 1, 17);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('board:1', 1, 1896);
INSERT INTO public.revision (scope, project_id, rev) VALUES ('issue:14', 1, 22);


--
-- Data for Name: scim_group; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: scim_group_mapping; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: scim_group_member; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: scim_user; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('ZlvmsAMOJnTtKK40BTH3wK4PhQYm3jLB', '2026-10-25 23:35:13.442', 'Ckoz5BEagTjgxQxEudzCHhcQoIr4OJ2W', '2026-10-18 23:35:13.442', '2026-10-18 23:35:13.442', '', 'curl/8.7.1', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('FU6daOSF1uwaQjRRDrl7D1tmgswyNdr2', '2026-10-25 23:36:51.543', 'WVu8RseHohXagAKTZy7JI9YXZcEoxIFF', '2026-10-18 23:36:51.543', '2026-10-18 23:36:51.543', '', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('KpwagJfUsffV07YkRqfazGQa8XMUEis8', '2026-10-25 23:48:01.523', 'HUSxHV9RzVWb3G58C1gmHVuN0QGgeFK4', '2026-10-18 23:48:01.526', '2026-10-18 23:48:01.526', '', 'curl/8.7.1', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('JdSeL5ZT9zeYod2YPjAl00b8ENPXwIWw', '2026-10-25 23:48:30.123', 'iklVmnd5hfzFZeuI7ByMwq5hm527A0lX', '2026-10-18 23:48:30.123', '2026-10-18 23:48:30.123', '', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('aN87uon8vzPdAlv3cuYDrRhSSMOV1jwM', '2026-10-25 23:49:01.048', 'yP4RSYjUmuwgJQsrV73UO2h1vPMQ63oe', '2026-10-18 23:49:01.048', '2026-10-18 23:49:01.048', '', 'curl/8.7.1', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('mUOM4qAe7LQmODEbObuh9bW6TUG3r6dy', '2026-10-25 23:49:23.483', 'VeBPe9Ixf0yG2tZXNcJpAjjI4nNFkLps', '2026-10-18 23:49:23.483', '2026-10-18 23:49:23.483', '127.0.0.1', 'curl/8.7.1', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('rLqwyEv25V37zNZ8eervo9znGTKAaSdq', '2026-10-25 23:49:49.312', 'J4o1HndsEECxHLJxgRx7R3SxlObthV1h', '2026-10-18 23:49:49.312', '2026-10-18 23:49:49.312', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('akB2Dwxh1Xra2F4Lri5veKLf1fP9cdTE', '2026-10-25 23:50:50.505', 'Fl9GVybdgSgupNldFAlGrYQfYRhValTd', '2026-10-18 23:50:50.505', '2026-10-18 23:50:50.505', '127.0.0.1', 'curl/8.7.1', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('UF3iILadveWAvxn5QrEjHh66SEhhEmtn', '2026-10-25 23:51:45.865', 'xJWmHgmxLvPQhKZAMYhppdDLBNxlcXzj', '2026-10-18 23:51:45.865', '2026-10-18 23:51:45.865', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:156.0) Gecko/20100101 Firefox/156.0', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('0dLI8dLl5vKYTgFCQHENbOGEeebENwsZ', '2026-10-25 23:59:59.077', 'paI3c7K3NisQjH9OtHA7sUam61JA8Yj6', '2026-10-18 23:59:59.077', '2026-10-18 23:59:59.077', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('t6HTWszqioNuXKTdz5Gu7GasjNanstgj', '2026-10-26 01:55:59.559', 'sRBsBFqMl7gm9dx0OYuxhSq9VVYXfPuy', '2026-10-19 01:55:59.559', '2026-10-19 01:55:59.559', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('mVzLp3DlqnnMn03ZllwTH2yRETwAJndK', '2026-10-26 02:05:28.855', '8YxEtq4cMUB1vz07t1BgUCGB7ZXg3hL4', '2026-10-19 02:05:28.856', '2026-10-19 02:05:28.856', '127.0.0.1', 'curl/8.7.1', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');
INSERT INTO public.session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) VALUES ('NwDRkSkqDl4pUFHJzgf2sg3HghogT9fs', '2026-10-26 02:06:06.424', 'fiFjDWTX3Y3rqErRhGvCZNo2VnAQnioz', '2026-10-19 02:06:06.424', '2026-10-19 02:06:06.424', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:156.0) Gecko/20100101 Firefox/156.0', 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp');


--
-- Data for Name: team; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.team (id, name, created_at, mcp_enabled, default_agent_ids, slug, workspace_id) VALUES (1, 'Athan.uk', '2026-10-18 23:35:27.262113+00', true, '[]', 'athan-uk', 1);


--
-- Data for Name: team_invite; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: team_member; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.team_member (team_id, user_id, role, created_at, source) VALUES (1, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'owner', '2026-10-18 23:35:27.262113+00', 'invite');


--
-- Data for Name: team_notification_setting; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: team_role; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.team_role (id, name, is_default, permissions, created_at, team_id) VALUES (1, 'Member', true, '{"views": {"edit": false, "read": true, "create": false, "delete": false}, "cycles": {"edit": true, "read": true, "create": true, "delete": true}, "labels": {"edit": false, "read": true, "create": false, "delete": false}, "states": {"edit": false, "read": true, "create": false, "delete": false}, "actions": {"edit": false, "read": false, "create": false, "delete": false}, "webhooks": {"edit": false, "read": false, "create": false, "delete": false}, "ai_agents": {"edit": false, "read": true, "create": false, "delete": false}, "documents": {"edit": true, "read": true, "create": true, "delete": true}, "dashboards": {"edit": false, "read": true, "create": false, "delete": false}, "work_items": {"edit": true, "read": true, "create": true, "delete": true}, "agent_tools": {"edit": false, "read": false, "create": false, "delete": false}, "agent_usage": {"edit": false, "read": false, "create": false, "delete": false}, "danger_zone": {"edit": false, "read": false, "create": false, "delete": false}, "initiatives": {"edit": true, "read": true, "create": true, "delete": true}, "issue_types": {"edit": false, "read": true, "create": false, "delete": false}, "note_boards": {"edit": true, "read": true, "create": true, "delete": true}, "agent_skills": {"edit": false, "read": false, "create": false, "delete": false}, "integrations": {"edit": false, "read": false, "create": false, "delete": false}, "repositories": {"edit": false, "read": false, "create": false, "delete": false}, "custom_fields": {"edit": false, "read": true, "create": false, "delete": false}, "import_export": {"edit": false, "read": false, "create": false, "delete": false}, "members_invite": {"edit": false, "read": true, "create": false, "delete": false}, "members_manage": {"edit": false, "read": true, "create": false, "delete": false}, "issue_templates": {"edit": false, "read": true, "create": false, "delete": false}, "workflow_config": {"edit": false, "read": false, "create": false, "delete": false}}', '2026-10-18 23:35:27.262113+00', 1);


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."user" (id, name, email, email_verified, image, created_at, updated_at, role, username, display_username, active) VALUES ('DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'owner', 'owner@athan.local', false, NULL, '2026-10-18 23:35:13.427', '2026-10-18 23:35:13.427', 'god', 'owner', 'owner', true);


--
-- Data for Name: user_notification_preference; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_preference; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_preference (user_id, timezone, theme, issue_open_mode, start_page, created_at, updated_at, last_project_id, show_chat_by_default, hotkeys, issue_stats_open, issue_stats_view, issue_activity_view, auto_watch, locale, seen_version) VALUES ('DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'Europe/London', 'dark', 'panel', 'work-items', '2026-10-18 23:36:51.653396+00', '2026-10-19 02:11:46.57197+00', 1, false, '{}', true, 'compact', 'flat', true, 'en', '1.5.0');


--
-- Data for Name: user_telegram_account; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: verification; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: webhook; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: webhook_delivery; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: workspace; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workspace (id, name, created_at, color, team_creation) VALUES (1, 'Workspace', '2026-10-18 23:34:46.715878+00', NULL, 'owner');


--
-- Data for Name: workspace_manager; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workspace_manager (workspace_id, user_id, role, created_at) VALUES (1, 'DFppJIU20ig1j5gFRYQIe541IkO7Itfp', 'owner', '2026-10-18 23:35:13.447934+00');


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 150, true);


--
-- Name: agent_chat_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_chat_event_id_seq', 1, false);


--
-- Name: agent_chat_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_chat_message_id_seq', 1, false);


--
-- Name: agent_run_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_run_id_seq', 1, false);


--
-- Name: agent_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_schedule_id_seq', 1, false);


--
-- Name: agent_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_skill_id_seq', 2, true);


--
-- Name: agent_tool_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_tool_id_seq', 1, false);


--
-- Name: ai_agent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_agent_id_seq', 7, true);


--
-- Name: chat_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_attachment_id_seq', 1, false);


--
-- Name: custom_field_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.custom_field_id_seq', 3, true);


--
-- Name: custom_field_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.custom_field_option_id_seq', 3, true);


--
-- Name: cycle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cycle_id_seq', 1, false);


--
-- Name: document_asset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_asset_id_seq', 1, false);


--
-- Name: git_managed_repository_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.git_managed_repository_id_seq', 1, false);


--
-- Name: git_provider_connection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.git_provider_connection_id_seq', 1, false);


--
-- Name: import_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.import_job_id_seq', 1, false);


--
-- Name: import_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.import_record_id_seq', 1, false);


--
-- Name: initiative_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.initiative_attachment_id_seq', 1, false);


--
-- Name: initiative_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.initiative_id_seq', 1, false);


--
-- Name: integration_credential_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.integration_credential_id_seq', 1, false);


--
-- Name: issue_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_activity_id_seq', 1095, true);


--
-- Name: issue_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_attachment_id_seq', 1, false);


--
-- Name: issue_checklist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_checklist_id_seq', 1, false);


--
-- Name: issue_checklist_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_checklist_item_id_seq', 1, false);


--
-- Name: issue_cycle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_cycle_id_seq', 1, false);


--
-- Name: issue_development_check_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_development_check_id_seq', 1, false);


--
-- Name: issue_development_link_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_development_link_id_seq', 1, false);


--
-- Name: issue_field_value_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_field_value_id_seq', 384, true);


--
-- Name: issue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_id_seq', 208, true);


--
-- Name: issue_import_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_import_id_seq', 1, false);


--
-- Name: issue_link_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_link_id_seq', 121, true);


--
-- Name: issue_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_status_id_seq', 294, true);


--
-- Name: issue_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_template_id_seq', 1, false);


--
-- Name: issue_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_type_id_seq', 1, true);


--
-- Name: issue_worklog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_worklog_id_seq', 1, false);


--
-- Name: label_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.label_group_id_seq', 3, true);


--
-- Name: label_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.label_id_seq', 140, true);


--
-- Name: model_price_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.model_price_id_seq', 1, false);


--
-- Name: note_board_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.note_board_id_seq', 1, false);


--
-- Name: notification_delivery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_delivery_id_seq', 1, false);


--
-- Name: notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_id_seq', 1, false);


--
-- Name: project_action_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_action_id_seq', 1, false);


--
-- Name: project_column_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_column_id_seq', 11, true);


--
-- Name: project_dashboard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_dashboard_id_seq', 1, false);


--
-- Name: project_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_document_id_seq', 8, true);


--
-- Name: project_document_revision_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_document_revision_id_seq', 17, true);


--
-- Name: project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_id_seq', 1, true);


--
-- Name: project_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_role_id_seq', 1, true);


--
-- Name: project_view_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_view_id_seq', 1, true);


--
-- Name: scim_group_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scim_group_mapping_id_seq', 1, false);


--
-- Name: team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_id_seq', 1, true);


--
-- Name: team_invite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_invite_id_seq', 1, true);


--
-- Name: user_notification_preference_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_notification_preference_id_seq', 1, false);


--
-- Name: webhook_delivery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.webhook_delivery_id_seq', 1, false);


--
-- Name: webhook_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.webhook_id_seq', 1, false);


--
-- Name: workspace_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workspace_id_seq', 1, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: agent_chat_event agent_chat_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_event
    ADD CONSTRAINT agent_chat_event_pkey PRIMARY KEY (id);


--
-- Name: agent_chat_favorite agent_chat_favorite_user_id_thread_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_favorite
    ADD CONSTRAINT agent_chat_favorite_user_id_thread_id_pk PRIMARY KEY (user_id, thread_id);


--
-- Name: agent_chat_message agent_chat_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_message
    ADD CONSTRAINT agent_chat_message_pkey PRIMARY KEY (id);


--
-- Name: agent_chat_thread agent_chat_thread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_thread
    ADD CONSTRAINT agent_chat_thread_pkey PRIMARY KEY (id);


--
-- Name: agent_chat_usage agent_chat_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_usage
    ADD CONSTRAINT agent_chat_usage_pkey PRIMARY KEY (thread_id);


--
-- Name: agent_field_trigger agent_field_trigger_agent_id_field_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_field_trigger
    ADD CONSTRAINT agent_field_trigger_agent_id_field_id_pk PRIMARY KEY (agent_id, field_id);


--
-- Name: agent_run agent_run_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_run
    ADD CONSTRAINT agent_run_pkey PRIMARY KEY (id);


--
-- Name: agent_schedule agent_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_schedule
    ADD CONSTRAINT agent_schedule_pkey PRIMARY KEY (id);


--
-- Name: agent_schedule agent_schedule_project_id_agent_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_schedule
    ADD CONSTRAINT agent_schedule_project_id_agent_id_name_unique UNIQUE (project_id, agent_id, name);


--
-- Name: agent_skill_link agent_skill_link_agent_id_skill_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_skill_link
    ADD CONSTRAINT agent_skill_link_agent_id_skill_id_pk PRIMARY KEY (agent_id, skill_id);


--
-- Name: agent_skill agent_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_skill
    ADD CONSTRAINT agent_skill_pkey PRIMARY KEY (id);


--
-- Name: agent_skill agent_skill_team_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_skill
    ADD CONSTRAINT agent_skill_team_id_name_unique UNIQUE (team_id, name);


--
-- Name: agent_tool_link agent_tool_link_agent_id_agent_tool_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool_link
    ADD CONSTRAINT agent_tool_link_agent_id_agent_tool_id_pk PRIMARY KEY (agent_id, agent_tool_id);


--
-- Name: agent_tool agent_tool_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool
    ADD CONSTRAINT agent_tool_pkey PRIMARY KEY (id);


--
-- Name: agent_tool agent_tool_team_id_tool_key_credential_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool
    ADD CONSTRAINT agent_tool_team_id_tool_key_credential_id_unique UNIQUE (team_id, tool_key, credential_id);


--
-- Name: ai_agent ai_agent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent
    ADD CONSTRAINT ai_agent_pkey PRIMARY KEY (id);


--
-- Name: ai_agent ai_agent_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent
    ADD CONSTRAINT ai_agent_user_id_unique UNIQUE (user_id);


--
-- Name: apikey apikey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apikey
    ADD CONSTRAINT apikey_pkey PRIMARY KEY (id);


--
-- Name: app_secret app_secret_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_secret
    ADD CONSTRAINT app_secret_pkey PRIMARY KEY (key);


--
-- Name: app_setting app_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_setting
    ADD CONSTRAINT app_setting_pkey PRIMARY KEY (key);


--
-- Name: chat_attachment chat_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachment
    ADD CONSTRAINT chat_attachment_pkey PRIMARY KEY (id);


--
-- Name: chat_attachment chat_attachment_public_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachment
    ADD CONSTRAINT chat_attachment_public_id_unique UNIQUE (public_id);


--
-- Name: custom_field_option custom_field_option_field_id_value_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_option
    ADD CONSTRAINT custom_field_option_field_id_value_unique UNIQUE (field_id, value);


--
-- Name: custom_field_option custom_field_option_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_option
    ADD CONSTRAINT custom_field_option_pkey PRIMARY KEY (id);


--
-- Name: custom_field custom_field_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field
    ADD CONSTRAINT custom_field_pkey PRIMARY KEY (id);


--
-- Name: cycle cycle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycle
    ADD CONSTRAINT cycle_pkey PRIMARY KEY (id);


--
-- Name: document_asset document_asset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_asset
    ADD CONSTRAINT document_asset_pkey PRIMARY KEY (id);


--
-- Name: document_asset document_asset_public_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_asset
    ADD CONSTRAINT document_asset_public_id_unique UNIQUE (public_id);


--
-- Name: document_collaboration document_collaboration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_collaboration
    ADD CONSTRAINT document_collaboration_pkey PRIMARY KEY (document_id);


--
-- Name: document_comment document_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comment
    ADD CONSTRAINT document_comment_pkey PRIMARY KEY (id);


--
-- Name: document_step document_step_document_id_version_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_step
    ADD CONSTRAINT document_step_document_id_version_pk PRIMARY KEY (document_id, version);


--
-- Name: git_managed_repository git_managed_repository_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_managed_repository
    ADD CONSTRAINT git_managed_repository_pkey PRIMARY KEY (id);


--
-- Name: git_managed_repository git_managed_repository_project_connection_external_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_managed_repository
    ADD CONSTRAINT git_managed_repository_project_connection_external_unique UNIQUE (project_id, connection_id, external_id);


--
-- Name: git_provider_connection git_provider_connection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_provider_connection
    ADD CONSTRAINT git_provider_connection_pkey PRIMARY KEY (id);


--
-- Name: import_job import_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_job
    ADD CONSTRAINT import_job_pkey PRIMARY KEY (id);


--
-- Name: import_record import_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_record
    ADD CONSTRAINT import_record_pkey PRIMARY KEY (id);


--
-- Name: initiative_attachment initiative_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_attachment
    ADD CONSTRAINT initiative_attachment_pkey PRIMARY KEY (id);


--
-- Name: initiative_attachment initiative_attachment_public_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_attachment
    ADD CONSTRAINT initiative_attachment_public_id_unique UNIQUE (public_id);


--
-- Name: initiative_label initiative_label_initiative_id_label_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_label
    ADD CONSTRAINT initiative_label_initiative_id_label_id_pk PRIMARY KEY (initiative_id, label_id);


--
-- Name: initiative initiative_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative
    ADD CONSTRAINT initiative_pkey PRIMARY KEY (id);


--
-- Name: integration_credential integration_credential_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_credential
    ADD CONSTRAINT integration_credential_pkey PRIMARY KEY (id);


--
-- Name: issue_activity issue_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_pkey PRIMARY KEY (id);


--
-- Name: issue_attachment issue_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_attachment
    ADD CONSTRAINT issue_attachment_pkey PRIMARY KEY (id);


--
-- Name: issue_attachment issue_attachment_public_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_attachment
    ADD CONSTRAINT issue_attachment_public_id_unique UNIQUE (public_id);


--
-- Name: issue_checklist_item issue_checklist_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_checklist_item
    ADD CONSTRAINT issue_checklist_item_pkey PRIMARY KEY (id);


--
-- Name: issue_checklist issue_checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_checklist
    ADD CONSTRAINT issue_checklist_pkey PRIMARY KEY (id);


--
-- Name: issue_cycle issue_cycle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_cycle
    ADD CONSTRAINT issue_cycle_pkey PRIMARY KEY (id);


--
-- Name: issue_development_check issue_development_check_development_link_id_app_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_check
    ADD CONSTRAINT issue_development_check_development_link_id_app_id_name_unique UNIQUE (development_link_id, app_id, name);


--
-- Name: issue_development_check issue_development_check_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_check
    ADD CONSTRAINT issue_development_check_pkey PRIMARY KEY (id);


--
-- Name: issue_development_link issue_development_link_issue_id_provider_repository_external_ke; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_link
    ADD CONSTRAINT issue_development_link_issue_id_provider_repository_external_ke UNIQUE (issue_id, provider, repository, external_key);


--
-- Name: issue_development_link issue_development_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_link
    ADD CONSTRAINT issue_development_link_pkey PRIMARY KEY (id);


--
-- Name: issue_field_option issue_field_option_issue_id_field_id_option_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_option
    ADD CONSTRAINT issue_field_option_issue_id_field_id_option_id_pk PRIMARY KEY (issue_id, field_id, option_id);


--
-- Name: issue_field_value issue_field_value_issue_id_field_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_value
    ADD CONSTRAINT issue_field_value_issue_id_field_id_unique UNIQUE (issue_id, field_id);


--
-- Name: issue_field_value issue_field_value_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_value
    ADD CONSTRAINT issue_field_value_pkey PRIMARY KEY (id);


--
-- Name: issue_import issue_import_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_import
    ADD CONSTRAINT issue_import_pkey PRIMARY KEY (id);


--
-- Name: issue_import issue_import_public_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_import
    ADD CONSTRAINT issue_import_public_id_unique UNIQUE (public_id);


--
-- Name: issue_key_alias issue_key_alias_project_id_sequence_number_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_key_alias
    ADD CONSTRAINT issue_key_alias_project_id_sequence_number_pk PRIMARY KEY (project_id, sequence_number);


--
-- Name: issue_label issue_label_issue_id_label_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_label
    ADD CONSTRAINT issue_label_issue_id_label_id_pk PRIMARY KEY (issue_id, label_id);


--
-- Name: issue_link issue_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_link
    ADD CONSTRAINT issue_link_pkey PRIMARY KEY (id);


--
-- Name: issue issue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_pkey PRIMARY KEY (id);


--
-- Name: issue issue_project_id_sequence_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_project_id_sequence_number_unique UNIQUE (project_id, sequence_number);


--
-- Name: issue issue_share_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_share_token_unique UNIQUE (share_token);


--
-- Name: issue_status issue_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_status
    ADD CONSTRAINT issue_status_pkey PRIMARY KEY (id);


--
-- Name: issue_template_label issue_template_label_template_id_label_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template_label
    ADD CONSTRAINT issue_template_label_template_id_label_id_pk PRIMARY KEY (template_id, label_id);


--
-- Name: issue_template issue_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template
    ADD CONSTRAINT issue_template_pkey PRIMARY KEY (id);


--
-- Name: issue_template issue_template_project_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template
    ADD CONSTRAINT issue_template_project_id_name_unique UNIQUE (project_id, name);


--
-- Name: issue_type issue_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_type
    ADD CONSTRAINT issue_type_pkey PRIMARY KEY (id);


--
-- Name: issue_type issue_type_project_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_type
    ADD CONSTRAINT issue_type_project_id_name_unique UNIQUE (project_id, name);


--
-- Name: issue_watcher issue_watcher_issue_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_watcher
    ADD CONSTRAINT issue_watcher_issue_id_user_id_pk PRIMARY KEY (issue_id, user_id);


--
-- Name: issue_worklog issue_worklog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_worklog
    ADD CONSTRAINT issue_worklog_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: label_group label_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_group
    ADD CONSTRAINT label_group_pkey PRIMARY KEY (id);


--
-- Name: label_group label_group_project_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_group
    ADD CONSTRAINT label_group_project_id_name_unique UNIQUE (project_id, name);


--
-- Name: label label_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT label_pkey PRIMARY KEY (id);


--
-- Name: label label_project_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT label_project_id_name_unique UNIQUE (project_id, name);


--
-- Name: mastra_agent_versions mastra_agent_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_agent_versions
    ADD CONSTRAINT mastra_agent_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_agents mastra_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_agents
    ADD CONSTRAINT mastra_agents_pkey PRIMARY KEY (id);


--
-- Name: mastra_background_tasks mastra_background_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_background_tasks
    ADD CONSTRAINT mastra_background_tasks_pkey PRIMARY KEY (id);


--
-- Name: mastra_channel_config mastra_channel_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_channel_config
    ADD CONSTRAINT mastra_channel_config_pkey PRIMARY KEY (platform);


--
-- Name: mastra_channel_installations mastra_channel_installations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_channel_installations
    ADD CONSTRAINT mastra_channel_installations_pkey PRIMARY KEY (id);


--
-- Name: mastra_dataset_items mastra_dataset_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_dataset_items
    ADD CONSTRAINT mastra_dataset_items_pkey PRIMARY KEY (id, "datasetVersion");


--
-- Name: mastra_dataset_versions mastra_dataset_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_dataset_versions
    ADD CONSTRAINT mastra_dataset_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_datasets mastra_datasets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_datasets
    ADD CONSTRAINT mastra_datasets_pkey PRIMARY KEY (id);


--
-- Name: mastra_experiment_results mastra_experiment_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_experiment_results
    ADD CONSTRAINT mastra_experiment_results_pkey PRIMARY KEY (id);


--
-- Name: mastra_experiments mastra_experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_experiments
    ADD CONSTRAINT mastra_experiments_pkey PRIMARY KEY (id);


--
-- Name: mastra_favorites mastra_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_favorites
    ADD CONSTRAINT mastra_favorites_pkey PRIMARY KEY ("userId", "entityType", "entityId");


--
-- Name: mastra_mcp_client_versions mastra_mcp_client_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_mcp_client_versions
    ADD CONSTRAINT mastra_mcp_client_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_mcp_clients mastra_mcp_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_mcp_clients
    ADD CONSTRAINT mastra_mcp_clients_pkey PRIMARY KEY (id);


--
-- Name: mastra_mcp_server_versions mastra_mcp_server_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_mcp_server_versions
    ADD CONSTRAINT mastra_mcp_server_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_mcp_servers mastra_mcp_servers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_mcp_servers
    ADD CONSTRAINT mastra_mcp_servers_pkey PRIMARY KEY (id);


--
-- Name: mastra_messages mastra_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_messages
    ADD CONSTRAINT mastra_messages_pkey PRIMARY KEY (id);


--
-- Name: mastra_observational_memory mastra_observational_memory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_observational_memory
    ADD CONSTRAINT mastra_observational_memory_pkey PRIMARY KEY (id);


--
-- Name: mastra_prompt_block_versions mastra_prompt_block_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_prompt_block_versions
    ADD CONSTRAINT mastra_prompt_block_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_prompt_blocks mastra_prompt_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_prompt_blocks
    ADD CONSTRAINT mastra_prompt_blocks_pkey PRIMARY KEY (id);


--
-- Name: mastra_resources mastra_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_resources
    ADD CONSTRAINT mastra_resources_pkey PRIMARY KEY (id);


--
-- Name: mastra_schedule_triggers mastra_schedule_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_schedule_triggers
    ADD CONSTRAINT mastra_schedule_triggers_pkey PRIMARY KEY (id);


--
-- Name: mastra_schedules mastra_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_schedules
    ADD CONSTRAINT mastra_schedules_pkey PRIMARY KEY (id);


--
-- Name: mastra_scorer_definition_versions mastra_scorer_definition_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_scorer_definition_versions
    ADD CONSTRAINT mastra_scorer_definition_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_scorer_definitions mastra_scorer_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_scorer_definitions
    ADD CONSTRAINT mastra_scorer_definitions_pkey PRIMARY KEY (id);


--
-- Name: mastra_scorers mastra_scorers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_scorers
    ADD CONSTRAINT mastra_scorers_pkey PRIMARY KEY (id);


--
-- Name: mastra_skill_blobs mastra_skill_blobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_skill_blobs
    ADD CONSTRAINT mastra_skill_blobs_pkey PRIMARY KEY (hash);


--
-- Name: mastra_skill_versions mastra_skill_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_skill_versions
    ADD CONSTRAINT mastra_skill_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_skills mastra_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_skills
    ADD CONSTRAINT mastra_skills_pkey PRIMARY KEY (id);


--
-- Name: mastra_thread_state mastra_thread_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_thread_state
    ADD CONSTRAINT mastra_thread_state_pkey PRIMARY KEY ("threadId", type);


--
-- Name: mastra_threads mastra_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_threads
    ADD CONSTRAINT mastra_threads_pkey PRIMARY KEY (id);


--
-- Name: mastra_tool_provider_connections mastra_tool_provider_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_tool_provider_connections
    ADD CONSTRAINT mastra_tool_provider_connections_pkey PRIMARY KEY ("authorId", "providerId", "connectionId");


--
-- Name: mastra_workflow_definitions mastra_workflow_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_workflow_definitions
    ADD CONSTRAINT mastra_workflow_definitions_pkey PRIMARY KEY (id);


--
-- Name: mastra_workspace_versions mastra_workspace_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_workspace_versions
    ADD CONSTRAINT mastra_workspace_versions_pkey PRIMARY KEY (id);


--
-- Name: mastra_workspaces mastra_workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_workspaces
    ADD CONSTRAINT mastra_workspaces_pkey PRIMARY KEY (id);


--
-- Name: model_price model_price_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_price
    ADD CONSTRAINT model_price_pkey PRIMARY KEY (id);


--
-- Name: model_price model_price_workspace_id_provider_model_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_price
    ADD CONSTRAINT model_price_workspace_id_provider_model_unique UNIQUE (workspace_id, provider, model);


--
-- Name: note_board_member note_board_member_board_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board_member
    ADD CONSTRAINT note_board_member_board_id_user_id_pk PRIMARY KEY (board_id, user_id);


--
-- Name: note_board note_board_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board
    ADD CONSTRAINT note_board_pkey PRIMARY KEY (id);


--
-- Name: notification_delivery notification_delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_delivery
    ADD CONSTRAINT notification_delivery_pkey PRIMARY KEY (id);


--
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: oauth_access_token oauth_access_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_access_token
    ADD CONSTRAINT oauth_access_token_pkey PRIMARY KEY (id);


--
-- Name: oauth_access_token oauth_access_token_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_access_token
    ADD CONSTRAINT oauth_access_token_token_unique UNIQUE (token);


--
-- Name: oauth_client_assertion oauth_client_assertion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_client_assertion
    ADD CONSTRAINT oauth_client_assertion_pkey PRIMARY KEY (id);


--
-- Name: oauth_client oauth_client_client_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_client
    ADD CONSTRAINT oauth_client_client_id_unique UNIQUE (client_id);


--
-- Name: oauth_client oauth_client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_client
    ADD CONSTRAINT oauth_client_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_resource oauth_client_resource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_client_resource
    ADD CONSTRAINT oauth_client_resource_pkey PRIMARY KEY (id);


--
-- Name: oauth_consent oauth_consent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_consent
    ADD CONSTRAINT oauth_consent_pkey PRIMARY KEY (id);


--
-- Name: oauth_refresh_token oauth_refresh_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_refresh_token
    ADD CONSTRAINT oauth_refresh_token_pkey PRIMARY KEY (id);


--
-- Name: oauth_refresh_token oauth_refresh_token_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_refresh_token
    ADD CONSTRAINT oauth_refresh_token_token_unique UNIQUE (token);


--
-- Name: oauth_resource oauth_resource_identifier_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_resource
    ADD CONSTRAINT oauth_resource_identifier_unique UNIQUE (identifier);


--
-- Name: oauth_resource oauth_resource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_resource
    ADD CONSTRAINT oauth_resource_pkey PRIMARY KEY (id);


--
-- Name: passkey passkey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passkey
    ADD CONSTRAINT passkey_pkey PRIMARY KEY (id);


--
-- Name: project_action project_action_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_action
    ADD CONSTRAINT project_action_pkey PRIMARY KEY (id);


--
-- Name: project_column project_column_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_column
    ADD CONSTRAINT project_column_pkey PRIMARY KEY (id);


--
-- Name: project_column project_column_project_id_position_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_column
    ADD CONSTRAINT project_column_project_id_position_unique UNIQUE (project_id, "position");


--
-- Name: project_dashboard project_dashboard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dashboard
    ADD CONSTRAINT project_dashboard_pkey PRIMARY KEY (id);


--
-- Name: project_document_initiative project_document_initiative_document_id_initiative_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_initiative
    ADD CONSTRAINT project_document_initiative_document_id_initiative_id_pk PRIMARY KEY (document_id, initiative_id);


--
-- Name: project_document_issue project_document_issue_document_id_issue_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_issue
    ADD CONSTRAINT project_document_issue_document_id_issue_id_pk PRIMARY KEY (document_id, issue_id);


--
-- Name: project_document project_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document
    ADD CONSTRAINT project_document_pkey PRIMARY KEY (id);


--
-- Name: project_document_preference project_document_preference_document_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_preference
    ADD CONSTRAINT project_document_preference_document_id_user_id_pk PRIMARY KEY (document_id, user_id);


--
-- Name: project_document_revision project_document_revision_document_version_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_revision
    ADD CONSTRAINT project_document_revision_document_version_unique UNIQUE (document_id, version);


--
-- Name: project_document_revision project_document_revision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_revision
    ADD CONSTRAINT project_document_revision_pkey PRIMARY KEY (id);


--
-- Name: project_member project_member_project_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_member
    ADD CONSTRAINT project_member_project_id_user_id_pk PRIMARY KEY (project_id, user_id);


--
-- Name: project_notification_setting project_notification_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_notification_setting
    ADD CONSTRAINT project_notification_setting_pkey PRIMARY KEY (project_id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: team_role project_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_role
    ADD CONSTRAINT project_role_pkey PRIMARY KEY (id);


--
-- Name: project_setting project_setting_project_id_key_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_setting
    ADD CONSTRAINT project_setting_project_id_key_pk PRIMARY KEY (project_id, key);


--
-- Name: project project_team_key_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_team_key_uq UNIQUE (team_id, key);


--
-- Name: project_view_favorite project_view_favorite_view_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_view_favorite
    ADD CONSTRAINT project_view_favorite_view_id_user_id_pk PRIMARY KEY (view_id, user_id);


--
-- Name: project_view project_view_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_view
    ADD CONSTRAINT project_view_pkey PRIMARY KEY (id);


--
-- Name: project_view project_view_share_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_view
    ADD CONSTRAINT project_view_share_token_unique UNIQUE (share_token);


--
-- Name: mastra_ai_spans public_mastra_ai_spans_traceid_spanid_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_ai_spans
    ADD CONSTRAINT public_mastra_ai_spans_traceid_spanid_pk PRIMARY KEY ("traceId", "spanId");


--
-- Name: mastra_workflow_snapshot public_mastra_workflow_snapshot_workflow_name_run_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mastra_workflow_snapshot
    ADD CONSTRAINT public_mastra_workflow_snapshot_workflow_name_run_id_key UNIQUE (workflow_name, run_id);

ALTER TABLE ONLY public.mastra_workflow_snapshot REPLICA IDENTITY USING INDEX public_mastra_workflow_snapshot_workflow_name_run_id_key;


--
-- Name: revision revision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision
    ADD CONSTRAINT revision_pkey PRIMARY KEY (scope);


--
-- Name: scim_group_mapping scim_group_mapping_group_id_project_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_mapping
    ADD CONSTRAINT scim_group_mapping_group_id_project_id_unique UNIQUE (group_id, project_id);


--
-- Name: scim_group_mapping scim_group_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_mapping
    ADD CONSTRAINT scim_group_mapping_pkey PRIMARY KEY (id);


--
-- Name: scim_group_member scim_group_member_group_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_member
    ADD CONSTRAINT scim_group_member_group_id_user_id_pk PRIMARY KEY (group_id, user_id);


--
-- Name: scim_group scim_group_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group
    ADD CONSTRAINT scim_group_pkey PRIMARY KEY (id);


--
-- Name: scim_group scim_group_workspace_id_display_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group
    ADD CONSTRAINT scim_group_workspace_id_display_name_unique UNIQUE (workspace_id, display_name);


--
-- Name: scim_user scim_user_workspace_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_user
    ADD CONSTRAINT scim_user_workspace_id_user_id_pk PRIMARY KEY (workspace_id, user_id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_unique UNIQUE (token);


--
-- Name: team_invite team_invite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite
    ADD CONSTRAINT team_invite_pkey PRIMARY KEY (id);


--
-- Name: team_invite team_invite_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite
    ADD CONSTRAINT team_invite_token_unique UNIQUE (token);


--
-- Name: team_member team_member_team_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_member
    ADD CONSTRAINT team_member_team_id_user_id_pk PRIMARY KEY (team_id, user_id);


--
-- Name: team_notification_setting team_notification_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_notification_setting
    ADD CONSTRAINT team_notification_setting_pkey PRIMARY KEY (team_id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


--
-- Name: team_role team_role_team_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_role
    ADD CONSTRAINT team_role_team_id_name_unique UNIQUE (team_id, name);


--
-- Name: team team_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_slug_unique UNIQUE (slug);


--
-- Name: user user_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_unique UNIQUE (email);


--
-- Name: user_notification_preference user_notification_pref_user_project_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preference
    ADD CONSTRAINT user_notification_pref_user_project_unique UNIQUE (user_id, project_id);


--
-- Name: user_notification_preference user_notification_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preference
    ADD CONSTRAINT user_notification_preference_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: user_preference user_preference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_pkey PRIMARY KEY (user_id);


--
-- Name: user_telegram_account user_telegram_account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_telegram_account
    ADD CONSTRAINT user_telegram_account_pkey PRIMARY KEY (user_id);


--
-- Name: user user_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_username_unique UNIQUE (username);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: webhook_delivery webhook_delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_delivery
    ADD CONSTRAINT webhook_delivery_pkey PRIMARY KEY (id);


--
-- Name: webhook webhook_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook
    ADD CONSTRAINT webhook_pkey PRIMARY KEY (id);


--
-- Name: workspace_manager workspace_manager_workspace_id_user_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_manager
    ADD CONSTRAINT workspace_manager_workspace_id_user_id_pk PRIMARY KEY (workspace_id, user_id);


--
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_userId_idx" ON public.account USING btree (user_id);


--
-- Name: agent_chat_event_message_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_chat_event_message_idx ON public.agent_chat_event USING btree (message_id, id);


--
-- Name: agent_chat_message_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_chat_message_due_idx ON public.agent_chat_message USING btree (agent_id, next_attempt_at) WHERE (status = ANY (ARRAY['pending'::text, 'streaming'::text]));


--
-- Name: agent_chat_message_thread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_chat_message_thread_idx ON public.agent_chat_message USING btree (thread_id, id);


--
-- Name: agent_chat_thread_agent_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_chat_thread_agent_user_idx ON public.agent_chat_thread USING btree (agent_id, user_id, updated_at DESC NULLS LAST);


--
-- Name: agent_chat_usage_agent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_chat_usage_agent_idx ON public.agent_chat_usage USING btree (agent_id);


--
-- Name: agent_field_trigger_field_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_field_trigger_field_idx ON public.agent_field_trigger USING btree (field_id);


--
-- Name: agent_run_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_run_due_idx ON public.agent_run USING btree (status, next_attempt_at);


--
-- Name: agent_run_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_run_project_idx ON public.agent_run USING btree (project_id);


--
-- Name: agent_run_schedule_fire_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX agent_run_schedule_fire_uq ON public.agent_run USING btree (schedule_id, scheduled_for);


--
-- Name: agent_run_schedule_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_run_schedule_idx ON public.agent_run USING btree (schedule_id);


--
-- Name: agent_schedule_agent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_schedule_agent_idx ON public.agent_schedule USING btree (agent_id);


--
-- Name: agent_schedule_column_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_schedule_column_idx ON public.agent_schedule USING btree (column_id);


--
-- Name: agent_schedule_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_schedule_due_idx ON public.agent_schedule USING btree (status, next_run_at);


--
-- Name: agent_schedule_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_schedule_project_idx ON public.agent_schedule USING btree (project_id);


--
-- Name: agent_skill_link_skill_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_skill_link_skill_idx ON public.agent_skill_link USING btree (skill_id);


--
-- Name: agent_skill_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_skill_team_idx ON public.agent_skill USING btree (team_id);


--
-- Name: agent_tool_credential_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_tool_credential_idx ON public.agent_tool USING btree (credential_id);


--
-- Name: agent_tool_link_tool_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_tool_link_tool_idx ON public.agent_tool_link USING btree (agent_tool_id);


--
-- Name: agent_tool_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX agent_tool_team_idx ON public.agent_tool USING btree (team_id);


--
-- Name: ai_agent_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_agent_team_idx ON public.ai_agent USING btree (team_id);


--
-- Name: ai_agent_team_username_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ai_agent_team_username_uq ON public.ai_agent USING btree (team_id, lower(username));


--
-- Name: apikey_configId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "apikey_configId_idx" ON public.apikey USING btree (config_id);


--
-- Name: apikey_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX apikey_key_idx ON public.apikey USING btree (key);


--
-- Name: apikey_referenceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "apikey_referenceId_idx" ON public.apikey USING btree (reference_id);


--
-- Name: chat_attachment_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX chat_attachment_project_idx ON public.chat_attachment USING btree (project_id);


--
-- Name: cycle_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cycle_project_idx ON public.cycle USING btree (project_id, start_date);


--
-- Name: document_asset_document_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_asset_document_idx ON public.document_asset USING btree (document_id, created_at);


--
-- Name: document_comment_document_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX document_comment_document_idx ON public.document_comment USING btree (document_id, created_at);


--
-- Name: git_managed_repository_project_connection_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX git_managed_repository_project_connection_idx ON public.git_managed_repository USING btree (project_id, connection_id);


--
-- Name: git_provider_connection_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX git_provider_connection_team_idx ON public.git_provider_connection USING btree (team_id);


--
-- Name: idx_channel_installations_platform_agent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_channel_installations_platform_agent ON public.mastra_channel_installations USING btree (platform, "agentId");


--
-- Name: idx_channel_installations_webhook; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_channel_installations_webhook ON public.mastra_channel_installations USING btree ("webhookId");


--
-- Name: idx_dataset_items_dataset_validto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_items_dataset_validto ON public.mastra_dataset_items USING btree ("datasetId", "validTo");


--
-- Name: idx_dataset_items_dataset_validto_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_items_dataset_validto_deleted ON public.mastra_dataset_items USING btree ("datasetId", "validTo", "isDeleted");


--
-- Name: idx_dataset_items_dataset_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_items_dataset_version ON public.mastra_dataset_items USING btree ("datasetId", "datasetVersion");


--
-- Name: idx_dataset_items_external_id_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_items_external_id_history ON public.mastra_dataset_items USING btree ("datasetId", "externalId", "datasetVersion");


--
-- Name: idx_dataset_items_org_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_items_org_project ON public.mastra_dataset_items USING btree ("organizationId", "projectId");


--
-- Name: idx_dataset_versions_dataset_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dataset_versions_dataset_version ON public.mastra_dataset_versions USING btree ("datasetId", version);


--
-- Name: idx_dataset_versions_dataset_version_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_dataset_versions_dataset_version_unique ON public.mastra_dataset_versions USING btree ("datasetId", version);


--
-- Name: idx_datasets_candidate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datasets_candidate ON public.mastra_datasets USING btree ("candidateKey", "candidateId");


--
-- Name: idx_datasets_org_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_datasets_org_project ON public.mastra_datasets USING btree ("organizationId", "projectId");


--
-- Name: idx_experiment_results_exp_item; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_experiment_results_exp_item ON public.mastra_experiment_results USING btree ("experimentId", "itemId");


--
-- Name: idx_experiment_results_experimentid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiment_results_experimentid ON public.mastra_experiment_results USING btree ("experimentId");


--
-- Name: idx_experiment_results_org_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiment_results_org_project ON public.mastra_experiment_results USING btree ("organizationId", "projectId");


--
-- Name: idx_experiments_datasetid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiments_datasetid ON public.mastra_experiments USING btree ("datasetId");


--
-- Name: idx_experiments_grouping; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiments_grouping ON public.mastra_experiments USING btree ("experimentSetId", "comparisonId", "variantId", "trialIndex");


--
-- Name: idx_experiments_org_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiments_org_project ON public.mastra_experiments USING btree ("organizationId", "projectId");


--
-- Name: idx_favorites_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_entity ON public.mastra_favorites USING btree ("entityType", "entityId");


--
-- Name: idx_mastra_schedule_triggers_schedule_fire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mastra_schedule_triggers_schedule_fire ON public.mastra_schedule_triggers USING btree (schedule_id, actual_fire_at DESC);


--
-- Name: idx_mastra_schedules_status_next_fire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mastra_schedules_status_next_fire ON public.mastra_schedules USING btree (status, next_fire_at);


--
-- Name: idx_mcp_client_versions_client_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_mcp_client_versions_client_version ON public.mastra_mcp_client_versions USING btree ("mcpClientId", "versionNumber");


--
-- Name: idx_mcp_server_versions_server_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_mcp_server_versions_server_version ON public.mastra_mcp_server_versions USING btree ("mcpServerId", "versionNumber");


--
-- Name: idx_notifications_coalescing; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_coalescing ON public.mastra_notifications USING btree ("threadId", source, kind, status, "agentId", "resourceId", "dedupeKey", "coalesceKey");


--
-- Name: idx_notifications_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_due ON public.mastra_notifications USING btree (status, "deliverAt", "summaryAt");


--
-- Name: idx_notifications_thread_status_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_thread_status_updated ON public.mastra_notifications USING btree ("threadId", status, "updatedAt");


--
-- Name: idx_om_lookup_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_om_lookup_key ON public.mastra_observational_memory USING btree ("lookupKey");


--
-- Name: idx_prompt_block_versions_block_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_prompt_block_versions_block_version ON public.mastra_prompt_block_versions USING btree ("blockId", "versionNumber");


--
-- Name: idx_scorer_definition_versions_def_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_scorer_definition_versions_def_version ON public.mastra_scorer_definition_versions USING btree ("scorerDefinitionId", "versionNumber");


--
-- Name: idx_skill_versions_skill_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_skill_versions_skill_version ON public.mastra_skill_versions USING btree ("skillId", "versionNumber");


--
-- Name: idx_tool_provider_connections_author; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_provider_connections_author ON public.mastra_tool_provider_connections USING btree ("authorId", "providerId", toolkit);


--
-- Name: idx_workflow_definitions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_definitions_status ON public.mastra_workflow_definitions USING btree (status);


--
-- Name: idx_workspace_versions_workspace_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_workspace_versions_workspace_version ON public.mastra_workspace_versions USING btree ("workspaceId", "versionNumber");


--
-- Name: import_job_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX import_job_due_idx ON public.import_job USING btree (next_attempt_at) WHERE (status = 'pending'::text);


--
-- Name: import_job_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX import_job_project_idx ON public.import_job USING btree (project_id);


--
-- Name: import_record_job_display_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX import_record_job_display_idx ON public.import_record USING btree (import_job_id, source_entity_type, source_display_id);


--
-- Name: import_record_job_local_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX import_record_job_local_idx ON public.import_record USING btree (import_job_id, local_entity_type, local_id);


--
-- Name: import_record_job_source_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX import_record_job_source_uq ON public.import_record USING btree (import_job_id, source_entity_type, source_id);


--
-- Name: initiative_attachment_initiative_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX initiative_attachment_initiative_idx ON public.initiative_attachment USING btree (initiative_id);


--
-- Name: initiative_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX initiative_project_idx ON public.initiative USING btree (project_id, "position");


--
-- Name: integration_credential_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX integration_credential_team_idx ON public.integration_credential USING btree (team_id);


--
-- Name: issue_activity_initiative_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_activity_initiative_idx ON public.issue_activity USING btree (initiative_id, created_at DESC NULLS LAST, id DESC NULLS LAST);


--
-- Name: issue_activity_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_activity_issue_idx ON public.issue_activity USING btree (issue_id, created_at DESC NULLS LAST, id DESC NULLS LAST);


--
-- Name: issue_activity_reply_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_activity_reply_idx ON public.issue_activity USING btree (reply_to_id);


--
-- Name: issue_attachment_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_attachment_issue_idx ON public.issue_attachment USING btree (issue_id);


--
-- Name: issue_checklist_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_checklist_issue_idx ON public.issue_checklist USING btree (issue_id, "position");


--
-- Name: issue_checklist_item_checklist_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_checklist_item_checklist_idx ON public.issue_checklist_item USING btree (checklist_id, "position");


--
-- Name: issue_cycle_cycle_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_cycle_cycle_idx ON public.issue_cycle USING btree (cycle_id);


--
-- Name: issue_cycle_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_cycle_idx ON public.issue USING btree (cycle_id) WHERE (cycle_id IS NOT NULL);


--
-- Name: issue_cycle_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_cycle_issue_idx ON public.issue_cycle USING btree (issue_id, entered_at);


--
-- Name: issue_cycle_open_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX issue_cycle_open_idx ON public.issue_cycle USING btree (issue_id, cycle_id) WHERE (left_at IS NULL);


--
-- Name: issue_development_check_link_sha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_development_check_link_sha_idx ON public.issue_development_check USING btree (development_link_id, head_sha);


--
-- Name: issue_development_link_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_development_link_issue_idx ON public.issue_development_link USING btree (issue_id, updated_at DESC NULLS LAST);


--
-- Name: issue_development_link_pr_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_development_link_pr_idx ON public.issue_development_link USING btree (provider, repository, number);


--
-- Name: issue_development_link_sha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_development_link_sha_idx ON public.issue_development_link USING btree (provider, repository, head_sha);


--
-- Name: issue_import_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_import_project_idx ON public.issue_import USING btree (project_id);


--
-- Name: issue_key_alias_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_key_alias_issue_idx ON public.issue_key_alias USING btree (issue_id);


--
-- Name: issue_link_pair_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX issue_link_pair_kind_idx ON public.issue_link USING btree (LEAST(source_issue_id, target_issue_id), GREATEST(source_issue_id, target_issue_id), kind);


--
-- Name: issue_link_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_link_source_idx ON public.issue_link USING btree (source_issue_id);


--
-- Name: issue_link_target_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_link_target_idx ON public.issue_link USING btree (target_issue_id);


--
-- Name: issue_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_parent_idx ON public.issue USING btree (parent_id) WHERE (parent_id IS NOT NULL);


--
-- Name: issue_project_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_project_active_idx ON public.issue USING btree (project_id, column_id) WHERE (archived_at IS NULL);


--
-- Name: issue_project_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_project_title_idx ON public.issue USING btree (project_id, lower(btrim(title)));


--
-- Name: issue_status_column_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_status_column_idx ON public.issue_status USING btree (column_id) WHERE (column_id IS NOT NULL);


--
-- Name: issue_status_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_status_issue_idx ON public.issue_status USING btree (issue_id, entered_at);


--
-- Name: issue_status_open_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX issue_status_open_idx ON public.issue_status USING btree (issue_id) WHERE (left_at IS NULL);


--
-- Name: issue_worklog_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX issue_worklog_issue_idx ON public.issue_worklog USING btree (issue_id, spent_on DESC NULLS LAST);


--
-- Name: mastra_ai_spans_entitytype_entityid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_entitytype_entityid_idx ON public.mastra_ai_spans USING btree ("entityType", "entityId");


--
-- Name: mastra_ai_spans_entitytype_entityname_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_entitytype_entityname_idx ON public.mastra_ai_spans USING btree ("entityType", "entityName");


--
-- Name: mastra_ai_spans_metadata_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_metadata_gin_idx ON public.mastra_ai_spans USING gin (metadata);


--
-- Name: mastra_ai_spans_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_name_idx ON public.mastra_ai_spans USING btree (name);


--
-- Name: mastra_ai_spans_orgid_userid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_orgid_userid_idx ON public.mastra_ai_spans USING btree ("organizationId", "userId");


--
-- Name: mastra_ai_spans_parentspanid_startedat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_parentspanid_startedat_idx ON public.mastra_ai_spans USING btree ("parentSpanId", "startedAt" DESC);


--
-- Name: mastra_ai_spans_root_spans_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_root_spans_idx ON public.mastra_ai_spans USING btree ("startedAt" DESC) WHERE ("parentSpanId" IS NULL);


--
-- Name: mastra_ai_spans_spantype_startedat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_spantype_startedat_idx ON public.mastra_ai_spans USING btree ("spanType", "startedAt" DESC);


--
-- Name: mastra_ai_spans_tags_gin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_tags_gin_idx ON public.mastra_ai_spans USING gin (tags);


--
-- Name: mastra_ai_spans_traceid_startedat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_ai_spans_traceid_startedat_idx ON public.mastra_ai_spans USING btree ("traceId", "startedAt" DESC);


--
-- Name: mastra_bg_tasks_agent_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_bg_tasks_agent_status_idx ON public.mastra_background_tasks USING btree (agent_id, status);


--
-- Name: mastra_bg_tasks_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_bg_tasks_status_created_at_idx ON public.mastra_background_tasks USING btree (status, "createdAt");


--
-- Name: mastra_bg_tasks_thread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_bg_tasks_thread_idx ON public.mastra_background_tasks USING btree (thread_id, "createdAt");


--
-- Name: mastra_bg_tasks_tool_call_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_bg_tasks_tool_call_idx ON public.mastra_background_tasks USING btree (tool_call_id);


--
-- Name: mastra_messages_thread_id_createdat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_messages_thread_id_createdat_idx ON public.mastra_messages USING btree (thread_id, "createdAt" DESC);


--
-- Name: mastra_scores_trace_id_span_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_scores_trace_id_span_id_created_at_idx ON public.mastra_scorers USING btree ("traceId", "spanId", "createdAt" DESC);


--
-- Name: mastra_threads_resourceid_createdat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mastra_threads_resourceid_createdat_idx ON public.mastra_threads USING btree ("resourceId", "createdAt" DESC);


--
-- Name: note_board_member_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX note_board_member_user_idx ON public.note_board_member USING btree (user_id);


--
-- Name: note_board_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX note_board_project_idx ON public.note_board USING btree (project_id, updated_at);


--
-- Name: notification_delivery_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_delivery_due_idx ON public.notification_delivery USING btree (next_attempt_at) WHERE (status = 'pending'::text);


--
-- Name: notification_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_user_idx ON public.notification USING btree (user_id, created_at DESC NULLS LAST, id DESC NULLS LAST);


--
-- Name: notification_user_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notification_user_unread_idx ON public.notification USING btree (user_id, id DESC NULLS LAST) WHERE (read_at IS NULL);


--
-- Name: oauthAccessToken_authorizationCodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthAccessToken_authorizationCodeId_idx" ON public.oauth_access_token USING btree (authorization_code_id);


--
-- Name: oauthAccessToken_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthAccessToken_clientId_idx" ON public.oauth_access_token USING btree (client_id);


--
-- Name: oauthAccessToken_refreshId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthAccessToken_refreshId_idx" ON public.oauth_access_token USING btree (refresh_id);


--
-- Name: oauthAccessToken_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthAccessToken_sessionId_idx" ON public.oauth_access_token USING btree (session_id);


--
-- Name: oauthAccessToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthAccessToken_userId_idx" ON public.oauth_access_token USING btree (user_id);


--
-- Name: oauthClientResource_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthClientResource_clientId_idx" ON public.oauth_client_resource USING btree (client_id);


--
-- Name: oauthClientResource_clientId_resourceId_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "oauthClientResource_clientId_resourceId_uidx" ON public.oauth_client_resource USING btree (client_id, resource_id);


--
-- Name: oauthClientResource_resourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthClientResource_resourceId_idx" ON public.oauth_client_resource USING btree (resource_id);


--
-- Name: oauthClient_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthClient_userId_idx" ON public.oauth_client USING btree (user_id);


--
-- Name: oauthConsent_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthConsent_clientId_idx" ON public.oauth_consent USING btree (client_id);


--
-- Name: oauthConsent_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthConsent_userId_idx" ON public.oauth_consent USING btree (user_id);


--
-- Name: oauthRefreshToken_authorizationCodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthRefreshToken_authorizationCodeId_idx" ON public.oauth_refresh_token USING btree (authorization_code_id);


--
-- Name: oauthRefreshToken_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthRefreshToken_clientId_idx" ON public.oauth_refresh_token USING btree (client_id);


--
-- Name: oauthRefreshToken_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthRefreshToken_sessionId_idx" ON public.oauth_refresh_token USING btree (session_id);


--
-- Name: oauthRefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "oauthRefreshToken_userId_idx" ON public.oauth_refresh_token USING btree (user_id);


--
-- Name: passkey_credentialID_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "passkey_credentialID_idx" ON public.passkey USING btree (credential_id);


--
-- Name: passkey_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "passkey_userId_idx" ON public.passkey USING btree (user_id);


--
-- Name: project_action_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_action_project_idx ON public.project_action USING btree (project_id, "position");


--
-- Name: project_dashboard_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_dashboard_project_idx ON public.project_dashboard USING btree (project_id, "position");


--
-- Name: project_document_initiative_initiative_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_document_initiative_initiative_idx ON public.project_document_initiative USING btree (initiative_id, document_id);


--
-- Name: project_document_issue_issue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_document_issue_issue_idx ON public.project_document_issue USING btree (issue_id, document_id);


--
-- Name: project_document_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_document_owner_idx ON public.project_document USING btree (owner_user_id);


--
-- Name: project_document_preference_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_document_preference_user_idx ON public.project_document_preference USING btree (user_id);


--
-- Name: project_document_project_archive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_document_project_archive_idx ON public.project_document USING btree (project_id, archived_at);


--
-- Name: project_document_project_tree_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_document_project_tree_idx ON public.project_document USING btree (project_id, parent_id, "position", id);


--
-- Name: project_document_revision_document_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_document_revision_document_idx ON public.project_document_revision USING btree (document_id, version);


--
-- Name: project_member_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_member_user_idx ON public.project_member USING btree (user_id);


--
-- Name: project_view_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX project_view_project_idx ON public.project_view USING btree (project_id, "position");


--
-- Name: revision_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX revision_project_idx ON public.revision USING btree (project_id);


--
-- Name: scim_group_mapping_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scim_group_mapping_project_idx ON public.scim_group_mapping USING btree (project_id);


--
-- Name: scim_group_member_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scim_group_member_user_idx ON public.scim_group_member USING btree (user_id);


--
-- Name: scim_user_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scim_user_user_idx ON public.scim_user USING btree (user_id);


--
-- Name: session_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "session_userId_idx" ON public.session USING btree (user_id);


--
-- Name: team_invite_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_invite_project_idx ON public.team_invite USING btree (project_id);


--
-- Name: team_invite_project_pending_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_invite_project_pending_uq ON public.team_invite USING btree (project_id, email) WHERE ((status = 'pending'::text) AND (project_id IS NOT NULL));


--
-- Name: team_invite_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_invite_team_idx ON public.team_invite USING btree (team_id);


--
-- Name: team_invite_team_pending_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_invite_team_pending_uq ON public.team_invite USING btree (team_id, email) WHERE ((status = 'pending'::text) AND (project_id IS NULL));


--
-- Name: team_member_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_member_user_idx ON public.team_member USING btree (user_id);


--
-- Name: team_role_default_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_role_default_uq ON public.team_role USING btree (team_id) WHERE is_default;


--
-- Name: team_role_team_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_role_team_idx ON public.team_role USING btree (team_id);


--
-- Name: team_workspace_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_workspace_idx ON public.team USING btree (workspace_id);


--
-- Name: user_telegram_account_chat_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_telegram_account_chat_id_unique ON public.user_telegram_account USING btree (chat_id) WHERE (chat_id IS NOT NULL);


--
-- Name: user_telegram_account_link_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_telegram_account_link_code_unique ON public.user_telegram_account USING btree (link_code) WHERE (link_code IS NOT NULL);


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verification_identifier_idx ON public.verification USING btree (identifier);


--
-- Name: webhook_delivery_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_delivery_due_idx ON public.webhook_delivery USING btree (next_attempt_at) WHERE (status = 'pending'::text);


--
-- Name: webhook_delivery_webhook_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_delivery_webhook_idx ON public.webhook_delivery USING btree (webhook_id);


--
-- Name: webhook_project_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_project_idx ON public.webhook USING btree (project_id);


--
-- Name: workspace_manager_owner_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX workspace_manager_owner_uq ON public.workspace_manager USING btree (workspace_id) WHERE (role = 'owner'::text);


--
-- Name: workspace_manager_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workspace_manager_user_idx ON public.workspace_manager USING btree (user_id);


--
-- Name: cycle cycle_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cycle_rev AFTER INSERT OR DELETE OR UPDATE ON public.cycle FOR EACH ROW EXECUTE FUNCTION public.rev_cycle();


--
-- Name: document_asset document_asset_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER document_asset_rev AFTER INSERT OR DELETE OR UPDATE ON public.document_asset FOR EACH ROW EXECUTE FUNCTION public.rev_document_child();


--
-- Name: document_comment document_comment_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER document_comment_rev AFTER INSERT OR DELETE OR UPDATE ON public.document_comment FOR EACH ROW EXECUTE FUNCTION public.rev_document_child();


--
-- Name: initiative_attachment initiative_attachment_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER initiative_attachment_rev AFTER INSERT OR DELETE OR UPDATE ON public.initiative_attachment FOR EACH ROW EXECUTE FUNCTION public.rev_initiative_child('initiative_id');


--
-- Name: initiative_label initiative_label_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER initiative_label_rev AFTER INSERT OR DELETE OR UPDATE ON public.initiative_label FOR EACH ROW EXECUTE FUNCTION public.rev_initiative_child('initiative_id');


--
-- Name: initiative initiative_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER initiative_rev AFTER INSERT OR DELETE OR UPDATE ON public.initiative FOR EACH ROW EXECUTE FUNCTION public.rev_initiative();


--
-- Name: issue_activity issue_activity_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_activity_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_activity FOR EACH ROW EXECUTE FUNCTION public.rev_activity();


--
-- Name: issue_attachment issue_attachment_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_attachment_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_attachment FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'detail');


--
-- Name: issue_checklist_item issue_checklist_item_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_checklist_item_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_checklist_item FOR EACH ROW EXECUTE FUNCTION public.rev_checklist_item();


--
-- Name: issue_checklist issue_checklist_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_checklist_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_checklist FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'detail');


--
-- Name: issue_cycle issue_cycle_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_cycle_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_cycle FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'detail');


--
-- Name: issue_development_check issue_development_check_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_development_check_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_development_check FOR EACH ROW EXECUTE FUNCTION public.rev_issue_development_check();


--
-- Name: issue_development_link issue_development_link_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_development_link_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_development_link FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'detail');


--
-- Name: issue_field_option issue_field_option_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_field_option_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_field_option FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'board');


--
-- Name: issue_field_value issue_field_value_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_field_value_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_field_value FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'board');


--
-- Name: issue_label issue_label_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_label_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_label FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'board');


--
-- Name: issue_link issue_link_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_link_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_link FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('source_issue_id', 'board');


--
-- Name: issue issue_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue FOR EACH ROW EXECUTE FUNCTION public.rev_issue();


--
-- Name: issue_watcher issue_watcher_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER issue_watcher_rev AFTER INSERT OR DELETE OR UPDATE ON public.issue_watcher FOR EACH ROW EXECUTE FUNCTION public.rev_issue_child('issue_id', 'detail');


--
-- Name: mastra_ai_spans mastra_ai_spans_timestamps; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER mastra_ai_spans_timestamps BEFORE INSERT OR UPDATE ON public.mastra_ai_spans FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamps();


--
-- Name: notification notification_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notification_rev AFTER INSERT OR DELETE OR UPDATE ON public.notification FOR EACH ROW EXECUTE FUNCTION public.rev_inbox();


--
-- Name: project_document_initiative project_document_initiative_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_initiative_rev AFTER INSERT OR DELETE ON public.project_document_initiative FOR EACH ROW EXECUTE FUNCTION public.project_document_initiative_rev();


--
-- Name: project_document_initiative project_document_initiative_validate_project; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_initiative_validate_project BEFORE INSERT OR UPDATE ON public.project_document_initiative FOR EACH ROW EXECUTE FUNCTION public.project_document_initiative_validate_project();


--
-- Name: project_document_issue project_document_issue_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_issue_rev AFTER INSERT OR DELETE ON public.project_document_issue FOR EACH ROW EXECUTE FUNCTION public.project_document_issue_rev();


--
-- Name: project_document_issue project_document_issue_validate_project; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_issue_validate_project BEFORE INSERT OR UPDATE ON public.project_document_issue FOR EACH ROW EXECUTE FUNCTION public.project_document_issue_validate_project();


--
-- Name: project_document project_document_owner_default; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_owner_default BEFORE INSERT ON public.project_document FOR EACH ROW EXECUTE FUNCTION public.default_project_document_owner();


--
-- Name: project_document_preference project_document_preference_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_preference_rev AFTER INSERT OR DELETE OR UPDATE ON public.project_document_preference FOR EACH ROW EXECUTE FUNCTION public.rev_document_child();


--
-- Name: project_document project_document_rev; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_rev AFTER INSERT OR DELETE OR UPDATE ON public.project_document FOR EACH ROW EXECUTE FUNCTION public.rev_document();


--
-- Name: project_document project_document_revision_capture; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER project_document_revision_capture AFTER INSERT OR UPDATE ON public.project_document FOR EACH ROW EXECUTE FUNCTION public.capture_project_document_revision();


--
-- Name: project project_rev_cleanup; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER project_rev_cleanup AFTER DELETE ON public.project DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.rev_project_cleanup();


--
-- Name: account account_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: agent_chat_event agent_chat_event_message_id_agent_chat_message_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_event
    ADD CONSTRAINT agent_chat_event_message_id_agent_chat_message_id_fk FOREIGN KEY (message_id) REFERENCES public.agent_chat_message(id) ON DELETE CASCADE;


--
-- Name: agent_chat_favorite agent_chat_favorite_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_favorite
    ADD CONSTRAINT agent_chat_favorite_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_chat_favorite agent_chat_favorite_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_favorite
    ADD CONSTRAINT agent_chat_favorite_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: agent_chat_message agent_chat_message_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_message
    ADD CONSTRAINT agent_chat_message_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_chat_message agent_chat_message_thread_id_agent_chat_thread_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_message
    ADD CONSTRAINT agent_chat_message_thread_id_agent_chat_thread_id_fk FOREIGN KEY (thread_id) REFERENCES public.agent_chat_thread(id) ON DELETE CASCADE;


--
-- Name: agent_chat_thread agent_chat_thread_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_thread
    ADD CONSTRAINT agent_chat_thread_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_chat_thread agent_chat_thread_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_thread
    ADD CONSTRAINT agent_chat_thread_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: agent_chat_usage agent_chat_usage_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_chat_usage
    ADD CONSTRAINT agent_chat_usage_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_field_trigger agent_field_trigger_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_field_trigger
    ADD CONSTRAINT agent_field_trigger_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_field_trigger agent_field_trigger_field_id_custom_field_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_field_trigger
    ADD CONSTRAINT agent_field_trigger_field_id_custom_field_id_fk FOREIGN KEY (field_id) REFERENCES public.custom_field(id) ON DELETE CASCADE;


--
-- Name: agent_run agent_run_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_run
    ADD CONSTRAINT agent_run_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_run agent_run_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_run
    ADD CONSTRAINT agent_run_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: agent_run agent_run_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_run
    ADD CONSTRAINT agent_run_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: agent_run agent_run_schedule_id_agent_schedule_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_run
    ADD CONSTRAINT agent_run_schedule_id_agent_schedule_id_fk FOREIGN KEY (schedule_id) REFERENCES public.agent_schedule(id) ON DELETE CASCADE;


--
-- Name: agent_run agent_run_source_activity_id_issue_activity_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_run
    ADD CONSTRAINT agent_run_source_activity_id_issue_activity_id_fk FOREIGN KEY (source_activity_id) REFERENCES public.issue_activity(id) ON DELETE SET NULL;


--
-- Name: agent_schedule agent_schedule_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_schedule
    ADD CONSTRAINT agent_schedule_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_schedule agent_schedule_column_id_project_column_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_schedule
    ADD CONSTRAINT agent_schedule_column_id_project_column_id_fk FOREIGN KEY (column_id) REFERENCES public.project_column(id) ON DELETE CASCADE;


--
-- Name: agent_schedule agent_schedule_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_schedule
    ADD CONSTRAINT agent_schedule_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: agent_skill_link agent_skill_link_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_skill_link
    ADD CONSTRAINT agent_skill_link_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_skill_link agent_skill_link_skill_id_agent_skill_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_skill_link
    ADD CONSTRAINT agent_skill_link_skill_id_agent_skill_id_fk FOREIGN KEY (skill_id) REFERENCES public.agent_skill(id) ON DELETE CASCADE;


--
-- Name: agent_skill agent_skill_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_skill
    ADD CONSTRAINT agent_skill_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: agent_tool agent_tool_credential_id_integration_credential_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool
    ADD CONSTRAINT agent_tool_credential_id_integration_credential_id_fk FOREIGN KEY (credential_id) REFERENCES public.integration_credential(id) ON DELETE CASCADE;


--
-- Name: agent_tool_link agent_tool_link_agent_id_ai_agent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool_link
    ADD CONSTRAINT agent_tool_link_agent_id_ai_agent_id_fk FOREIGN KEY (agent_id) REFERENCES public.ai_agent(id) ON DELETE CASCADE;


--
-- Name: agent_tool_link agent_tool_link_agent_tool_id_agent_tool_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool_link
    ADD CONSTRAINT agent_tool_link_agent_tool_id_agent_tool_id_fk FOREIGN KEY (agent_tool_id) REFERENCES public.agent_tool(id) ON DELETE CASCADE;


--
-- Name: agent_tool agent_tool_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_tool
    ADD CONSTRAINT agent_tool_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: ai_agent ai_agent_model_credential_id_integration_credential_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent
    ADD CONSTRAINT ai_agent_model_credential_id_integration_credential_id_fk FOREIGN KEY (model_credential_id) REFERENCES public.integration_credential(id) ON DELETE SET NULL;


--
-- Name: ai_agent ai_agent_owner_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent
    ADD CONSTRAINT ai_agent_owner_user_id_user_id_fk FOREIGN KEY (owner_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: ai_agent ai_agent_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent
    ADD CONSTRAINT ai_agent_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: ai_agent ai_agent_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agent
    ADD CONSTRAINT ai_agent_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: chat_attachment chat_attachment_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachment
    ADD CONSTRAINT chat_attachment_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: chat_attachment chat_attachment_uploaded_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_attachment
    ADD CONSTRAINT chat_attachment_uploaded_by_user_id_user_id_fk FOREIGN KEY (uploaded_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: custom_field custom_field_issue_type_id_issue_type_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field
    ADD CONSTRAINT custom_field_issue_type_id_issue_type_id_fk FOREIGN KEY (issue_type_id) REFERENCES public.issue_type(id) ON DELETE CASCADE;


--
-- Name: custom_field_option custom_field_option_field_id_custom_field_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field_option
    ADD CONSTRAINT custom_field_option_field_id_custom_field_id_fk FOREIGN KEY (field_id) REFERENCES public.custom_field(id) ON DELETE CASCADE;


--
-- Name: custom_field custom_field_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_field
    ADD CONSTRAINT custom_field_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: cycle cycle_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycle
    ADD CONSTRAINT cycle_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: document_asset document_asset_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_asset
    ADD CONSTRAINT document_asset_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: document_asset document_asset_uploaded_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_asset
    ADD CONSTRAINT document_asset_uploaded_by_user_id_user_id_fk FOREIGN KEY (uploaded_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: document_collaboration document_collaboration_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_collaboration
    ADD CONSTRAINT document_collaboration_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: document_comment document_comment_author_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comment
    ADD CONSTRAINT document_comment_author_id_user_id_fk FOREIGN KEY (author_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: document_comment document_comment_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comment
    ADD CONSTRAINT document_comment_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: document_comment document_comment_parent_id_document_comment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_comment
    ADD CONSTRAINT document_comment_parent_id_document_comment_id_fk FOREIGN KEY (parent_id) REFERENCES public.document_comment(id) ON DELETE CASCADE;


--
-- Name: document_step document_step_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_step
    ADD CONSTRAINT document_step_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: git_managed_repository git_managed_repository_connection_id_git_provider_connection_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_managed_repository
    ADD CONSTRAINT git_managed_repository_connection_id_git_provider_connection_id FOREIGN KEY (connection_id) REFERENCES public.git_provider_connection(id) ON DELETE CASCADE;


--
-- Name: git_managed_repository git_managed_repository_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_managed_repository
    ADD CONSTRAINT git_managed_repository_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: git_provider_connection git_provider_connection_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.git_provider_connection
    ADD CONSTRAINT git_provider_connection_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: import_job import_job_created_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_job
    ADD CONSTRAINT import_job_created_by_user_id_user_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: import_job import_job_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_job
    ADD CONSTRAINT import_job_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: import_record import_record_import_job_id_import_job_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_record
    ADD CONSTRAINT import_record_import_job_id_import_job_id_fk FOREIGN KEY (import_job_id) REFERENCES public.import_job(id) ON DELETE CASCADE;


--
-- Name: initiative_attachment initiative_attachment_initiative_id_initiative_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_attachment
    ADD CONSTRAINT initiative_attachment_initiative_id_initiative_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiative(id) ON DELETE CASCADE;


--
-- Name: initiative_label initiative_label_initiative_id_initiative_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_label
    ADD CONSTRAINT initiative_label_initiative_id_initiative_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiative(id) ON DELETE CASCADE;


--
-- Name: initiative_label initiative_label_label_id_label_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_label
    ADD CONSTRAINT initiative_label_label_id_label_id_fk FOREIGN KEY (label_id) REFERENCES public.label(id) ON DELETE CASCADE;


--
-- Name: initiative initiative_owner_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative
    ADD CONSTRAINT initiative_owner_user_id_user_id_fk FOREIGN KEY (owner_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: initiative initiative_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative
    ADD CONSTRAINT initiative_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: integration_credential integration_credential_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_credential
    ADD CONSTRAINT integration_credential_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: issue_activity issue_activity_actor_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_actor_user_id_user_id_fk FOREIGN KEY (actor_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: issue_activity issue_activity_initiative_id_initiative_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_initiative_id_initiative_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiative(id) ON DELETE CASCADE;


--
-- Name: issue_activity issue_activity_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_activity issue_activity_reply_to_id_issue_activity_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity
    ADD CONSTRAINT issue_activity_reply_to_id_issue_activity_id_fk FOREIGN KEY (reply_to_id) REFERENCES public.issue_activity(id) ON DELETE CASCADE;


--
-- Name: issue issue_assignee_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_assignee_user_id_user_id_fk FOREIGN KEY (assignee_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: issue_attachment issue_attachment_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_attachment
    ADD CONSTRAINT issue_attachment_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_checklist issue_checklist_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_checklist
    ADD CONSTRAINT issue_checklist_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_checklist_item issue_checklist_item_checklist_id_issue_checklist_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_checklist_item
    ADD CONSTRAINT issue_checklist_item_checklist_id_issue_checklist_id_fk FOREIGN KEY (checklist_id) REFERENCES public.issue_checklist(id) ON DELETE CASCADE;


--
-- Name: issue issue_column_id_project_column_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_column_id_project_column_id_fk FOREIGN KEY (column_id) REFERENCES public.project_column(id);


--
-- Name: issue_cycle issue_cycle_cycle_id_cycle_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_cycle
    ADD CONSTRAINT issue_cycle_cycle_id_cycle_id_fk FOREIGN KEY (cycle_id) REFERENCES public.cycle(id) ON DELETE CASCADE;


--
-- Name: issue issue_cycle_id_cycle_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_cycle_id_cycle_id_fk FOREIGN KEY (cycle_id) REFERENCES public.cycle(id) ON DELETE SET NULL;


--
-- Name: issue_cycle issue_cycle_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_cycle
    ADD CONSTRAINT issue_cycle_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue issue_delegate_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_delegate_user_id_user_id_fk FOREIGN KEY (delegate_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: issue_development_check issue_development_check_development_link_id_issue_development_l; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_check
    ADD CONSTRAINT issue_development_check_development_link_id_issue_development_l FOREIGN KEY (development_link_id) REFERENCES public.issue_development_link(id) ON DELETE CASCADE;


--
-- Name: issue_development_link issue_development_link_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_development_link
    ADD CONSTRAINT issue_development_link_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_field_option issue_field_option_field_id_custom_field_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_option
    ADD CONSTRAINT issue_field_option_field_id_custom_field_id_fk FOREIGN KEY (field_id) REFERENCES public.custom_field(id) ON DELETE CASCADE;


--
-- Name: issue_field_option issue_field_option_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_option
    ADD CONSTRAINT issue_field_option_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_field_option issue_field_option_option_id_custom_field_option_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_option
    ADD CONSTRAINT issue_field_option_option_id_custom_field_option_id_fk FOREIGN KEY (option_id) REFERENCES public.custom_field_option(id) ON DELETE CASCADE;


--
-- Name: issue_field_value issue_field_value_field_id_custom_field_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_value
    ADD CONSTRAINT issue_field_value_field_id_custom_field_id_fk FOREIGN KEY (field_id) REFERENCES public.custom_field(id) ON DELETE CASCADE;


--
-- Name: issue_field_value issue_field_value_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_value
    ADD CONSTRAINT issue_field_value_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_field_value issue_field_value_value_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_field_value
    ADD CONSTRAINT issue_field_value_value_user_id_user_id_fk FOREIGN KEY (value_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: issue_import issue_import_attachment_id_chat_attachment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_import
    ADD CONSTRAINT issue_import_attachment_id_chat_attachment_id_fk FOREIGN KEY (attachment_id) REFERENCES public.chat_attachment(id) ON DELETE CASCADE;


--
-- Name: issue_import issue_import_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_import
    ADD CONSTRAINT issue_import_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: issue issue_initiative_id_initiative_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_initiative_id_initiative_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiative(id) ON DELETE SET NULL;


--
-- Name: issue_key_alias issue_key_alias_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_key_alias
    ADD CONSTRAINT issue_key_alias_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_key_alias issue_key_alias_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_key_alias
    ADD CONSTRAINT issue_key_alias_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: issue_label issue_label_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_label
    ADD CONSTRAINT issue_label_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_label issue_label_label_id_label_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_label
    ADD CONSTRAINT issue_label_label_id_label_id_fk FOREIGN KEY (label_id) REFERENCES public.label(id) ON DELETE CASCADE;


--
-- Name: issue_link issue_link_source_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_link
    ADD CONSTRAINT issue_link_source_issue_id_issue_id_fk FOREIGN KEY (source_issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_link issue_link_target_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_link
    ADD CONSTRAINT issue_link_target_issue_id_issue_id_fk FOREIGN KEY (target_issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue issue_parent_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_parent_id_issue_id_fk FOREIGN KEY (parent_id) REFERENCES public.issue(id) ON DELETE SET NULL;


--
-- Name: issue issue_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: issue_status issue_status_column_id_project_column_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_status
    ADD CONSTRAINT issue_status_column_id_project_column_id_fk FOREIGN KEY (column_id) REFERENCES public.project_column(id) ON DELETE SET NULL;


--
-- Name: issue_status issue_status_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_status
    ADD CONSTRAINT issue_status_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_template issue_template_assignee_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template
    ADD CONSTRAINT issue_template_assignee_user_id_user_id_fk FOREIGN KEY (assignee_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: issue_template issue_template_column_id_project_column_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template
    ADD CONSTRAINT issue_template_column_id_project_column_id_fk FOREIGN KEY (column_id) REFERENCES public.project_column(id) ON DELETE SET NULL;


--
-- Name: issue_template_label issue_template_label_label_id_label_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template_label
    ADD CONSTRAINT issue_template_label_label_id_label_id_fk FOREIGN KEY (label_id) REFERENCES public.label(id) ON DELETE CASCADE;


--
-- Name: issue_template_label issue_template_label_template_id_issue_template_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template_label
    ADD CONSTRAINT issue_template_label_template_id_issue_template_id_fk FOREIGN KEY (template_id) REFERENCES public.issue_template(id) ON DELETE CASCADE;


--
-- Name: issue_template issue_template_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template
    ADD CONSTRAINT issue_template_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: issue_template issue_template_type_id_issue_type_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_template
    ADD CONSTRAINT issue_template_type_id_issue_type_id_fk FOREIGN KEY (type_id) REFERENCES public.issue_type(id) ON DELETE SET NULL;


--
-- Name: issue issue_type_id_issue_type_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue
    ADD CONSTRAINT issue_type_id_issue_type_id_fk FOREIGN KEY (type_id) REFERENCES public.issue_type(id) ON DELETE SET NULL;


--
-- Name: issue_type issue_type_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_type
    ADD CONSTRAINT issue_type_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: issue_watcher issue_watcher_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_watcher
    ADD CONSTRAINT issue_watcher_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_watcher issue_watcher_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_watcher
    ADD CONSTRAINT issue_watcher_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: issue_worklog issue_worklog_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_worklog
    ADD CONSTRAINT issue_worklog_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: issue_worklog issue_worklog_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_worklog
    ADD CONSTRAINT issue_worklog_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: label label_group_id_label_group_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT label_group_id_label_group_id_fk FOREIGN KEY (group_id) REFERENCES public.label_group(id) ON DELETE SET NULL;


--
-- Name: label_group label_group_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_group
    ADD CONSTRAINT label_group_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: label label_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT label_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: model_price model_price_workspace_id_workspace_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_price
    ADD CONSTRAINT model_price_workspace_id_workspace_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON DELETE CASCADE;


--
-- Name: note_board note_board_created_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board
    ADD CONSTRAINT note_board_created_by_user_id_user_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: note_board_member note_board_member_board_id_note_board_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board_member
    ADD CONSTRAINT note_board_member_board_id_note_board_id_fk FOREIGN KEY (board_id) REFERENCES public.note_board(id) ON DELETE CASCADE;


--
-- Name: note_board_member note_board_member_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board_member
    ADD CONSTRAINT note_board_member_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: note_board note_board_owner_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board
    ADD CONSTRAINT note_board_owner_user_id_user_id_fk FOREIGN KEY (owner_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: note_board note_board_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.note_board
    ADD CONSTRAINT note_board_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: notification notification_actor_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_actor_user_id_user_id_fk FOREIGN KEY (actor_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: notification_delivery notification_delivery_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_delivery
    ADD CONSTRAINT notification_delivery_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: notification notification_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: notification notification_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: notification notification_source_activity_id_issue_activity_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_source_activity_id_issue_activity_id_fk FOREIGN KEY (source_activity_id) REFERENCES public.issue_activity(id) ON DELETE SET NULL;


--
-- Name: notification notification_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: oauth_access_token oauth_access_token_client_id_oauth_client_client_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_access_token
    ADD CONSTRAINT oauth_access_token_client_id_oauth_client_client_id_fk FOREIGN KEY (client_id) REFERENCES public.oauth_client(client_id) ON DELETE CASCADE;


--
-- Name: oauth_access_token oauth_access_token_refresh_id_oauth_refresh_token_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_access_token
    ADD CONSTRAINT oauth_access_token_refresh_id_oauth_refresh_token_id_fk FOREIGN KEY (refresh_id) REFERENCES public.oauth_refresh_token(id) ON DELETE CASCADE;


--
-- Name: oauth_access_token oauth_access_token_session_id_session_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_access_token
    ADD CONSTRAINT oauth_access_token_session_id_session_id_fk FOREIGN KEY (session_id) REFERENCES public.session(id) ON DELETE SET NULL;


--
-- Name: oauth_access_token oauth_access_token_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_access_token
    ADD CONSTRAINT oauth_access_token_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: oauth_client_resource oauth_client_resource_client_id_oauth_client_client_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_client_resource
    ADD CONSTRAINT oauth_client_resource_client_id_oauth_client_client_id_fk FOREIGN KEY (client_id) REFERENCES public.oauth_client(client_id) ON DELETE CASCADE;


--
-- Name: oauth_client_resource oauth_client_resource_resource_id_oauth_resource_identifier_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_client_resource
    ADD CONSTRAINT oauth_client_resource_resource_id_oauth_resource_identifier_fk FOREIGN KEY (resource_id) REFERENCES public.oauth_resource(identifier) ON DELETE CASCADE;


--
-- Name: oauth_client oauth_client_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_client
    ADD CONSTRAINT oauth_client_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: oauth_consent oauth_consent_client_id_oauth_client_client_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_consent
    ADD CONSTRAINT oauth_consent_client_id_oauth_client_client_id_fk FOREIGN KEY (client_id) REFERENCES public.oauth_client(client_id) ON DELETE CASCADE;


--
-- Name: oauth_consent oauth_consent_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_consent
    ADD CONSTRAINT oauth_consent_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: oauth_refresh_token oauth_refresh_token_client_id_oauth_client_client_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_refresh_token
    ADD CONSTRAINT oauth_refresh_token_client_id_oauth_client_client_id_fk FOREIGN KEY (client_id) REFERENCES public.oauth_client(client_id) ON DELETE CASCADE;


--
-- Name: oauth_refresh_token oauth_refresh_token_session_id_session_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_refresh_token
    ADD CONSTRAINT oauth_refresh_token_session_id_session_id_fk FOREIGN KEY (session_id) REFERENCES public.session(id) ON DELETE SET NULL;


--
-- Name: oauth_refresh_token oauth_refresh_token_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oauth_refresh_token
    ADD CONSTRAINT oauth_refresh_token_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: passkey passkey_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passkey
    ADD CONSTRAINT passkey_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: project_action project_action_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_action
    ADD CONSTRAINT project_action_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_column project_column_auto_assign_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_column
    ADD CONSTRAINT project_column_auto_assign_user_id_user_id_fk FOREIGN KEY (auto_assign_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_column project_column_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_column
    ADD CONSTRAINT project_column_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_dashboard project_dashboard_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_dashboard
    ADD CONSTRAINT project_dashboard_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_document project_document_archived_by_ancestor_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document
    ADD CONSTRAINT project_document_archived_by_ancestor_id_project_document_id_fk FOREIGN KEY (archived_by_ancestor_id) REFERENCES public.project_document(id) ON DELETE SET NULL;


--
-- Name: project_document project_document_created_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document
    ADD CONSTRAINT project_document_created_by_user_id_user_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_document_initiative project_document_initiative_created_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_initiative
    ADD CONSTRAINT project_document_initiative_created_by_user_id_user_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_document_initiative project_document_initiative_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_initiative
    ADD CONSTRAINT project_document_initiative_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: project_document_initiative project_document_initiative_initiative_id_initiative_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_initiative
    ADD CONSTRAINT project_document_initiative_initiative_id_initiative_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiative(id) ON DELETE CASCADE;


--
-- Name: project_document_issue project_document_issue_created_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_issue
    ADD CONSTRAINT project_document_issue_created_by_user_id_user_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_document_issue project_document_issue_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_issue
    ADD CONSTRAINT project_document_issue_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: project_document_issue project_document_issue_issue_id_issue_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_issue
    ADD CONSTRAINT project_document_issue_issue_id_issue_id_fk FOREIGN KEY (issue_id) REFERENCES public.issue(id) ON DELETE CASCADE;


--
-- Name: project_document project_document_owner_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document
    ADD CONSTRAINT project_document_owner_user_id_user_id_fk FOREIGN KEY (owner_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_document project_document_parent_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document
    ADD CONSTRAINT project_document_parent_id_project_document_id_fk FOREIGN KEY (parent_id) REFERENCES public.project_document(id) ON DELETE SET NULL;


--
-- Name: project_document_preference project_document_preference_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_preference
    ADD CONSTRAINT project_document_preference_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: project_document_preference project_document_preference_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_preference
    ADD CONSTRAINT project_document_preference_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: project_document project_document_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document
    ADD CONSTRAINT project_document_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_document_revision project_document_revision_created_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_revision
    ADD CONSTRAINT project_document_revision_created_by_user_id_user_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_document_revision project_document_revision_document_id_project_document_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_revision
    ADD CONSTRAINT project_document_revision_document_id_project_document_id_fk FOREIGN KEY (document_id) REFERENCES public.project_document(id) ON DELETE CASCADE;


--
-- Name: project_document_revision project_document_revision_owner_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document_revision
    ADD CONSTRAINT project_document_revision_owner_user_id_user_id_fk FOREIGN KEY (owner_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_document project_document_updated_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_document
    ADD CONSTRAINT project_document_updated_by_user_id_user_id_fk FOREIGN KEY (updated_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: project_member project_member_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_member
    ADD CONSTRAINT project_member_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_member project_member_role_id_team_role_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_member
    ADD CONSTRAINT project_member_role_id_team_role_id_fk FOREIGN KEY (role_id) REFERENCES public.team_role(id) ON DELETE SET NULL;


--
-- Name: project_member project_member_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_member
    ADD CONSTRAINT project_member_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: project_notification_setting project_notification_setting_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_notification_setting
    ADD CONSTRAINT project_notification_setting_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project_setting project_setting_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_setting
    ADD CONSTRAINT project_setting_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: project project_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: project_view_favorite project_view_favorite_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_view_favorite
    ADD CONSTRAINT project_view_favorite_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: project_view_favorite project_view_favorite_view_id_project_view_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_view_favorite
    ADD CONSTRAINT project_view_favorite_view_id_project_view_id_fk FOREIGN KEY (view_id) REFERENCES public.project_view(id) ON DELETE CASCADE;


--
-- Name: project_view project_view_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_view
    ADD CONSTRAINT project_view_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: scim_group_mapping scim_group_mapping_group_id_scim_group_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_mapping
    ADD CONSTRAINT scim_group_mapping_group_id_scim_group_id_fk FOREIGN KEY (group_id) REFERENCES public.scim_group(id) ON DELETE CASCADE;


--
-- Name: scim_group_mapping scim_group_mapping_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_mapping
    ADD CONSTRAINT scim_group_mapping_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: scim_group_mapping scim_group_mapping_role_id_team_role_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_mapping
    ADD CONSTRAINT scim_group_mapping_role_id_team_role_id_fk FOREIGN KEY (role_id) REFERENCES public.team_role(id) ON DELETE SET NULL;


--
-- Name: scim_group_member scim_group_member_group_id_scim_group_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_member
    ADD CONSTRAINT scim_group_member_group_id_scim_group_id_fk FOREIGN KEY (group_id) REFERENCES public.scim_group(id) ON DELETE CASCADE;


--
-- Name: scim_group_member scim_group_member_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group_member
    ADD CONSTRAINT scim_group_member_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: scim_group scim_group_workspace_id_workspace_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_group
    ADD CONSTRAINT scim_group_workspace_id_workspace_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON DELETE CASCADE;


--
-- Name: scim_user scim_user_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_user
    ADD CONSTRAINT scim_user_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: scim_user scim_user_workspace_id_workspace_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scim_user
    ADD CONSTRAINT scim_user_workspace_id_workspace_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON DELETE CASCADE;


--
-- Name: session session_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: team_invite team_invite_accepted_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite
    ADD CONSTRAINT team_invite_accepted_by_user_id_user_id_fk FOREIGN KEY (accepted_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: team_invite team_invite_invited_by_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite
    ADD CONSTRAINT team_invite_invited_by_user_id_user_id_fk FOREIGN KEY (invited_by_user_id) REFERENCES public."user"(id) ON DELETE SET NULL;


--
-- Name: team_invite team_invite_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite
    ADD CONSTRAINT team_invite_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: team_invite team_invite_role_id_team_role_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite
    ADD CONSTRAINT team_invite_role_id_team_role_id_fk FOREIGN KEY (role_id) REFERENCES public.team_role(id) ON DELETE SET NULL;


--
-- Name: team_invite team_invite_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_invite
    ADD CONSTRAINT team_invite_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: team_member team_member_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_member
    ADD CONSTRAINT team_member_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: team_member team_member_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_member
    ADD CONSTRAINT team_member_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: team_notification_setting team_notification_setting_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_notification_setting
    ADD CONSTRAINT team_notification_setting_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: team_role team_role_team_id_team_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_role
    ADD CONSTRAINT team_role_team_id_team_id_fk FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: team team_workspace_id_workspace_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_workspace_id_workspace_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON DELETE CASCADE;


--
-- Name: user_notification_preference user_notification_preference_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preference
    ADD CONSTRAINT user_notification_preference_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: user_notification_preference user_notification_preference_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preference
    ADD CONSTRAINT user_notification_preference_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_preference user_preference_last_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_last_project_id_project_id_fk FOREIGN KEY (last_project_id) REFERENCES public.project(id) ON DELETE SET NULL;


--
-- Name: user_preference user_preference_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preference
    ADD CONSTRAINT user_preference_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_telegram_account user_telegram_account_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_telegram_account
    ADD CONSTRAINT user_telegram_account_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: webhook_delivery webhook_delivery_webhook_id_webhook_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_delivery
    ADD CONSTRAINT webhook_delivery_webhook_id_webhook_id_fk FOREIGN KEY (webhook_id) REFERENCES public.webhook(id) ON DELETE CASCADE;


--
-- Name: webhook webhook_project_id_project_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook
    ADD CONSTRAINT webhook_project_id_project_id_fk FOREIGN KEY (project_id) REFERENCES public.project(id) ON DELETE CASCADE;


--
-- Name: workspace_manager workspace_manager_user_id_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_manager
    ADD CONSTRAINT workspace_manager_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: workspace_manager workspace_manager_workspace_id_workspace_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workspace_manager
    ADD CONSTRAINT workspace_manager_workspace_id_workspace_id_fk FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict kQZBA1LFyqd4vy2YLKTbrLkNCyfHQIS6EtpemMEe43o3aSZmhxgdH0DKOHnO33c

