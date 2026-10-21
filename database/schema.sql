--
-- PostgreSQL database dump
--

\restrict 92dg8T1pafMXP2lymwkgX6oPBrrf9rz43Q7mRIdURrI3rDhtvAgPWSfaBWCeHDu

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-21 04:38:38

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16465)
-- Name: application; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application (
    application_id integer NOT NULL,
    volunteer_id integer NOT NULL,
    opportunity_id integer NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    decision_at timestamp without time zone
);


ALTER TABLE public.application OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16464)
-- Name: application_application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.application ALTER COLUMN application_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.application_application_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 236 (class 1259 OID 16551)
-- Name: chatbot_faq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chatbot_faq (
    faq_id integer NOT NULL,
    question character varying(255) NOT NULL,
    answer text NOT NULL,
    keywords text,
    is_active boolean DEFAULT true
);


ALTER TABLE public.chatbot_faq OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16550)
-- Name: chatbot_faq_faq_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.chatbot_faq ALTER COLUMN faq_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.chatbot_faq_faq_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 234 (class 1259 OID 16533)
-- Name: notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notification OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16532)
-- Name: notification_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.notification ALTER COLUMN notification_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notification_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 16448)
-- Name: opportunity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opportunity (
    opportunity_id integer NOT NULL,
    organisation_id integer NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    location character varying(150),
    start_datetime timestamp without time zone,
    end_datetime timestamp without time zone,
    required_volunteers integer,
    status character varying(30) DEFAULT 'open'::character varying
);


ALTER TABLE public.opportunity OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16447)
-- Name: opportunity_opportunity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.opportunity ALTER COLUMN opportunity_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.opportunity_opportunity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 16514)
-- Name: opportunity_skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opportunity_skill (
    opportunity_id integer NOT NULL,
    skill_id integer NOT NULL
);


ALTER TABLE public.opportunity_skill OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16417)
-- Name: organisation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organisation (
    organisation_id integer NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    address text,
    verification_status character varying(30) DEFAULT 'pending'::character varying
);


ALTER TABLE public.organisation OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16430)
-- Name: organisation_member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organisation_member (
    organisation_id integer NOT NULL,
    user_id integer NOT NULL,
    member_role character varying(50)
);


ALTER TABLE public.organisation_member OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16416)
-- Name: organisation_organisation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.organisation ALTER COLUMN organisation_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.organisation_organisation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 16562)
-- Name: password_reset_token; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_token (
    user_id integer NOT NULL,
    token_hash character(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    used_at timestamp with time zone
);


ALTER TABLE public.password_reset_token OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16488)
-- Name: skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill (
    skill_id integer NOT NULL,
    skill_name character varying(100) NOT NULL
);


ALTER TABLE public.skill OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16487)
-- Name: skill_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.skill ALTER COLUMN skill_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.skill_skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 16385)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_user_role CHECK (((role)::text = ANY ((ARRAY['volunteer'::character varying, 'organisation_admin'::character varying, 'system_admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16384)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 221 (class 1259 OID 16401)
-- Name: volunteer_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.volunteer_profile (
    volunteer_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    location character varying(150),
    availability_summary text
);


ALTER TABLE public.volunteer_profile OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16497)
-- Name: volunteer_skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.volunteer_skill (
    volunteer_id integer NOT NULL,
    skill_id integer NOT NULL
);


ALTER TABLE public.volunteer_skill OWNER TO postgres;

--
-- TOC entry 4932 (class 2606 OID 16474)
-- Name: application application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application
    ADD CONSTRAINT application_pkey PRIMARY KEY (application_id);


--
-- TOC entry 4934 (class 2606 OID 16476)
-- Name: application application_volunteer_id_opportunity_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application
    ADD CONSTRAINT application_volunteer_id_opportunity_id_key UNIQUE (volunteer_id, opportunity_id);


--
-- TOC entry 4946 (class 2606 OID 16561)
-- Name: chatbot_faq chatbot_faq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_faq
    ADD CONSTRAINT chatbot_faq_pkey PRIMARY KEY (faq_id);


--
-- TOC entry 4944 (class 2606 OID 16544)
-- Name: notification notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 4930 (class 2606 OID 16458)
-- Name: opportunity opportunity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_pkey PRIMARY KEY (opportunity_id);


--
-- TOC entry 4942 (class 2606 OID 16520)
-- Name: opportunity_skill opportunity_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunity_skill
    ADD CONSTRAINT opportunity_skill_pkey PRIMARY KEY (opportunity_id, skill_id);


--
-- TOC entry 4924 (class 2606 OID 16429)
-- Name: organisation organisation_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organisation
    ADD CONSTRAINT organisation_email_key UNIQUE (email);


--
-- TOC entry 4928 (class 2606 OID 16436)
-- Name: organisation_member organisation_member_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organisation_member
    ADD CONSTRAINT organisation_member_pkey PRIMARY KEY (organisation_id, user_id);


--
-- TOC entry 4926 (class 2606 OID 16427)
-- Name: organisation organisation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organisation
    ADD CONSTRAINT organisation_pkey PRIMARY KEY (organisation_id);


--
-- TOC entry 4949 (class 2606 OID 16571)
-- Name: password_reset_token password_reset_token_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_token
    ADD CONSTRAINT password_reset_token_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4951 (class 2606 OID 16573)
-- Name: password_reset_token password_reset_token_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_token
    ADD CONSTRAINT password_reset_token_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 4936 (class 2606 OID 16494)
-- Name: skill skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_pkey PRIMARY KEY (skill_id);


--
-- TOC entry 4938 (class 2606 OID 16496)
-- Name: skill skill_skill_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill
    ADD CONSTRAINT skill_skill_name_key UNIQUE (skill_name);


--
-- TOC entry 4918 (class 2606 OID 16400)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4920 (class 2606 OID 16398)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4922 (class 2606 OID 16410)
-- Name: volunteer_profile volunteer_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_profile
    ADD CONSTRAINT volunteer_profile_pkey PRIMARY KEY (volunteer_id);


--
-- TOC entry 4940 (class 2606 OID 16503)
-- Name: volunteer_skill volunteer_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_skill
    ADD CONSTRAINT volunteer_skill_pkey PRIMARY KEY (volunteer_id, skill_id);


--
-- TOC entry 4947 (class 1259 OID 16579)
-- Name: idx_password_reset_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_expires_at ON public.password_reset_token USING btree (expires_at);


--
-- TOC entry 4956 (class 2606 OID 16482)
-- Name: application application_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application
    ADD CONSTRAINT application_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunity(opportunity_id) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 16477)
-- Name: application application_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application
    ADD CONSTRAINT application_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteer_profile(volunteer_id) ON DELETE CASCADE;


--
-- TOC entry 4952 (class 2606 OID 16411)
-- Name: volunteer_profile fk_volunteer_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_profile
    ADD CONSTRAINT fk_volunteer_user FOREIGN KEY (volunteer_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 16545)
-- Name: notification notification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification
    ADD CONSTRAINT notification_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4955 (class 2606 OID 16459)
-- Name: opportunity opportunity_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisation(organisation_id) ON DELETE CASCADE;


--
-- TOC entry 4960 (class 2606 OID 16521)
-- Name: opportunity_skill opportunity_skill_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunity_skill
    ADD CONSTRAINT opportunity_skill_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunity(opportunity_id) ON DELETE CASCADE;


--
-- TOC entry 4961 (class 2606 OID 16526)
-- Name: opportunity_skill opportunity_skill_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opportunity_skill
    ADD CONSTRAINT opportunity_skill_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(skill_id) ON DELETE CASCADE;


--
-- TOC entry 4953 (class 2606 OID 16437)
-- Name: organisation_member organisation_member_organisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organisation_member
    ADD CONSTRAINT organisation_member_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisation(organisation_id) ON DELETE CASCADE;


--
-- TOC entry 4954 (class 2606 OID 16442)
-- Name: organisation_member organisation_member_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organisation_member
    ADD CONSTRAINT organisation_member_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 16574)
-- Name: password_reset_token password_reset_token_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_token
    ADD CONSTRAINT password_reset_token_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4958 (class 2606 OID 16509)
-- Name: volunteer_skill volunteer_skill_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_skill
    ADD CONSTRAINT volunteer_skill_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skill(skill_id) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 16504)
-- Name: volunteer_skill volunteer_skill_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteer_skill
    ADD CONSTRAINT volunteer_skill_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteer_profile(volunteer_id) ON DELETE CASCADE;


-- Completed on 2026-10-21 04:38:39

--
-- PostgreSQL database dump complete
--

\unrestrict 92dg8T1pafMXP2lymwkgX6oPBrrf9rz43Q7mRIdURrI3rDhtvAgPWSfaBWCeHDu

