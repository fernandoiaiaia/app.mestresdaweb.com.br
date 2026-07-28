import { generateScopeSchema } from "./src/modules/assembler/assembler.schemas";

const targetPayload = {
  "id": "draft_abc",
  "title": "Nova Proposta",
  "clientId": null,
  "validityDays": 15,
  "projectSummary": "Sistema Teste asdf",
  "createdAt": new Date().toISOString(),
  "mode": "scope_user",
  "users": [
    {
      "id": "u_94p1r203c",
      "userName": "Novo Usuário",
      "platforms": [
        {
          "id": "p_p59296q9f",
          "platformName": "Nova Plataforma",
          "objective": "",
          "modules": []
        }
      ]
    }
  ],
  "integrations": []
};

const res = generateScopeSchema.safeParse(targetPayload);
if (!res.success) {
   console.log(JSON.stringify(res.error.format(), null, 2));
} else {
   console.log("Success");
}
