-- Adiciona tagline (subtítulo personalizável do header) e desconto de pagamento antecipado
alter table establishments
  add column if not exists tagline text,
  add column if not exists prepay_discount smallint not null default 10
    check (prepay_discount >= 0 and prepay_discount <= 100);
