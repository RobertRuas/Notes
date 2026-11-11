/* ============================================================
 * api.js
 * Cliente HTTP enxuto para a API windlog.
 * Centraliza headers, tratamento de erros e desembrulho do envelope
 * `{ ok, data, error }` que a API retorna.
 * ============================================================ */

window.Api = (() => {
  const { API_BASE, API_KEY } = window.AppConfig;

  /**
   * Executa uma chamada HTTP e desembrulha a resposta.
   * @throws Error com `.code` e `.status` quando a API devolve erro.
   */
  async function request(method, path, body) {
    const headers = {
      'X-API-Key': API_KEY,
    };
    const options = { method, headers };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    let resp;
    try {
      resp = await fetch(`${API_BASE}${path}`, options);
    } catch (e) {
      // Erro de rede (sem resposta do servidor)
      const err = new Error('Falha de rede ao contatar o servidor.');
      err.code = 'NETWORK';
      throw err;
    }

    // Algumas respostas (ex: 204) podem não ter corpo
    let payload = null;
    const text = await resp.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!resp.ok || (payload && payload.ok === false)) {
      const err = new Error(
        (payload && payload.error && payload.error.message) ||
          `Erro HTTP ${resp.status}`,
      );
      err.code = (payload && payload.error && payload.error.code) || 'HTTP_ERROR';
      err.status = resp.status;
      throw err;
    }

    return payload ? payload.data : null;
  }

  // ----- Operações genéricas sobre coleções -----

  /** Cria um novo documento na coleção */
  const create = (collection, data) => request('POST', `/v1/${collection}`, data);

  /** Lê um documento por id */
  const get = (collection, id) => request('GET', `/v1/${collection}/${id}`);

  /** Lista documentos (com paginação) */
  const list = (collection, { limit = 50, offset = 0 } = {}) =>
    request('GET', `/v1/${collection}?limit=${limit}&offset=${offset}`);

  /** Atualiza parcialmente (merge) */
  const patch = (collection, id, data) =>
    request('PATCH', `/v1/${collection}/${id}`, data);

  /** Substitui completamente o conteúdo */
  const put = (collection, id, data) =>
    request('PUT', `/v1/${collection}/${id}`, data);

  /** Remove (soft-delete) */
  const remove = (collection, id) =>
    request('DELETE', `/v1/${collection}/${id}`);

  return { request, create, get, list, patch, put, remove };
})();
