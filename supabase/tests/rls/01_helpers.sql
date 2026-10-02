create schema t;
grant usage on schema t to anon, authenticated, service_role;
create function t.check(label text, q text, want_ok boolean) returns void language plpgsql as $$
declare n int; err text;
begin
  begin
    execute q;
    get diagnostics n = row_count;
  exception when others then err := sqlerrm; n := -1;
  end;
  if want_ok and n >= 1 then raise notice 'PASS  allowed  | %', label;
  elsif not want_ok and n <= 0 then raise notice 'PASS  blocked  | % (%)', label, coalesce(err, '0 rows');
  elsif want_ok then raise notice 'FAIL  expected allowed | % (%)', label, coalesce(err, '0 rows');
  else raise notice 'FAIL  expected blocked | % (% rows changed)', label, n;
  end if;
end $$;
create function t.assert(label text, cond boolean) returns void language plpgsql as $$
begin if cond then raise notice 'PASS  check    | %', label; else raise notice 'FAIL  check    | %', label; end if; end $$;
grant execute on all functions in schema t to anon, authenticated, service_role;
