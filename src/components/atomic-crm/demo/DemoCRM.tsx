import { memoryStore } from "ra-core";

import { authProvider, dataProvider } from "../providers/fakerest";
import { CRM } from "../root/CRM";

const store = memoryStore();

const DemoCRM = () => (
  <CRM dataProvider={dataProvider} authProvider={authProvider} store={store} />
);

export default DemoCRM;
