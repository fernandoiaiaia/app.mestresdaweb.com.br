import type { MetadataRoute } from "next";

/**
 * hub.mestresdaweb.com.br — ferramenta interna, nunca deve aparecer na busca.
 *
 * Em 27/08/2026 este subdominio ainda NAO estava indexado (verificado por
 * `site:mestresdaweb.com.br`), mas tambem nao tinha protecao nenhuma: sem
 * robots.txt, sem noindex, e respondendo 200 para qualquer crawler. Era
 * questao de tempo.
 *
 * Aqui o `Disallow: /` e seguro justamente por nao haver nada indexado para
 * desindexar — ele impede o rastreamento desde o inicio. A protecao real e
 * redundante, no cabecalho `X-Robots-Tag: noindex` de next.config.ts, para o
 * caso de alguma URL escapar por um link externo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
