/**
 * Client Supabase pour Mycélium
 * Charge après le script CDN @supabase/supabase-js
 */
(function () {
  var SUPABASE_URL = 'https://grpkptcjwwklffcztydq.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycGtwdGNqd3drbGZmY3p0eWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Njg0NzQsImV4cCI6MjA4ODQ0NDQ3NH0.MO_WVQUDG0o9pEO9YlIfLRFTZvR-Vfs06Ck3Vvvd1tI';

  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Mycélium: Supabase JS non chargé. Utilisez le CDN @supabase/supabase-js avant ce script.');
    window.supabaseClient = null;
  }
})();
