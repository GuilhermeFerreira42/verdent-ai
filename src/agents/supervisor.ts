export class Supervisor {
  state: 'INIT' | 'PLAN' | 'CODE' | 'VERIFY' | 'DONE' = 'INIT';

  constructor() {}

  async processRequest(request: string) {
    // Lógica de orquestração
  }
}
