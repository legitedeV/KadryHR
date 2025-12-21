import api from '../api/axios';

// Ten plik jest "mostem" dla starego kodu.
// Działa zarówno:
//   import api from '../utils/api'
//   import { api } from '../utils/api'

export { api };
export default api;
