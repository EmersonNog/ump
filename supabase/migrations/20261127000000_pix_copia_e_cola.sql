-- Código "Pix copia e cola" (BR Code) da conta da UMP.
-- O app gera, a partir dele, o QR Code de cada cobrança já com o valor preenchido.
alter table public.configuracoes
  add column pix_copia_cola text check (pix_copia_cola is null or char_length(pix_copia_cola) <= 512);
