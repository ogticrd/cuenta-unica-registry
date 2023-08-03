import {
  LoginFlow,
  UiNode,
  UiNodeMeta,
  UiNodeInputAttributes,
  UpdateLoginFlowBody,
} from '@ory/client';
import {
  filterNodesByGroups,
  isUiNodeInputAttributes,
} from '@ory/integrations/ui';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import BoxContentCenter from '@/components/elements/boxContentCenter';
import { CardAuth } from '@/components/elements/cardAuth';
import LandingChica2 from '../../../public/assets/landingChica.svg';
import { Box, Button, Link, TextField, Typography } from '@mui/material';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { ButtonApp } from '@/components/elements/button';
import { TextBodyTiny } from '@/components/elements/typography';
import { orySdk } from '@/sdk';

export default function Login() {
  const [flow, setFlow] = useState<LoginFlow>();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // check if the login flow is for two factor authentication
    const aal2 = searchParams.get('aal2');
    // we can redirect the user back to the page they were on before login
    const returnTo = searchParams.get('return_to');
    orySdk
      .createBrowserLoginFlow({
        returnTo: returnTo || '',
        // if the user has a session, refresh it
        refresh: true,
        // if the aal2 query parameter is set, we get the two factor login flow UI nodes
        aal: aal2 ? 'aal2' : 'aal1',
      })
      .then(({ data: flow }) => {
        // set the flow data
        setFlow(flow);
      })
      .catch((err) => {
        // Couldn't create login flow
        // handle the error
      });
  }, [searchParams]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    // map the entire form data to JSON for the request body
    let body = Object.fromEntries(formData) as unknown as UpdateLoginFlowBody;

    // We need the method specified from the name and value of the submit button.
    // when multiple submit buttons are present, the clicked one's value is used.
    if ('submitter' in event.nativeEvent) {
      const method = (
        event.nativeEvent as unknown as { submitter: HTMLInputElement }
      ).submitter;
      body = {
        ...body,
        ...{ [method.name]: method.value },
      };
    }

    orySdk
      .updateLoginFlow({
        flow: flow!.id,
        updateLoginFlowBody: body,
      })
      .then(() => {
        router.replace('/login/result');
      })
      .catch((err) => {
        // handle the error
        console.log(err);
        if (err.response.status === 400) {
          // user input error
          // show the error messages in the UI
          setFlow(err.response.data);
        }
      });
  };

  const mapUINode = (node: UiNode, key: number) => {
    // other node types are also supported
    // if (isUiNodeTextAttributes(node.attributes)) {
    // if (isUiNodeImageAttributes(node.attributes)) {
    // if (isUiNodeAnchorAttributes(node.attributes)) {
    console.log(node);
    if (isUiNodeInputAttributes(node.attributes)) {
      const attrs = node.attributes as UiNodeInputAttributes;
      const meta = node.meta as UiNodeMeta;
      const nodeType = attrs.type;
      switch (nodeType) {
        case 'button':
        case 'submit':
          return (
            <button
              type={attrs.type as 'submit' | 'reset' | 'button' | undefined}
              name={attrs.name}
              value={attrs.value}
              key={key}
            >
              Iniciar sesión
            </button>
          );
        default:
          return (
            <input
              name={attrs.name}
              type={attrs.type}
              autoComplete={
                attrs.autocomplete || attrs.name === 'identifier'
                  ? 'username'
                  : ''
              }
              defaultValue={attrs.value}
              required={attrs.required}
              disabled={attrs.disabled}
              key={key}
            />
          );
      }
    }
  };

  return flow ? (
    <BoxContentCenter>
      <CardAuth
        title="Inicio de sesión"
        landing={LandingChica2}
        landingWidth={450}
        landingHeight={400}
      >
        <Typography component="div" color="primary" textAlign="center">
          <Box sx={{ fontWeight: 500, fontSize: '16px', my: 4 }}>
            Acceder a tu cuenta
          </Box>
        </Typography>
        <form action={flow.ui.action} method={flow.ui.method} onSubmit={submit}>
          <GridContainer>
            {filterNodesByGroups({
              nodes: flow.ui.nodes,
              attributes: ['hidden'],
              // we will also map default fields here such as csrf_token
              // this only maps the `password` method
              // you can also map `oidc` or `webauhthn` here as well
              groups: ['default'],
            }).map((node, key) => mapUINode(node, key))}
            <GridItem lg={12} md={12}>
              <TextField
                required
                name="identifier"
                label="Número de Cédula"
                placeholder="***-**00000-0"
                autoComplete="username"
                fullWidth
              />
            </GridItem>
            <GridItem lg={12} md={12}>
              <TextField
                required
                name="password"
                type="password"
                label="Contraseña"
                placeholder="*********"
                autoComplete="username"
                fullWidth
              />
            </GridItem>
            <GridItem lg={12} md={12}>
              <br />
              {/* <button type="submit" name="method" value="password">Iniciar sesión</button> */}
              <ButtonApp name="method" value="password" submit disabled={false}>
                INICIAR SESIÓN
              </ButtonApp>
            </GridItem>
          </GridContainer>
        </form>
        <GridContainer>
          <GridItem md={12} lg={12}>
            <br />
            <TextBodyTiny textCenter>
              <span className="text-secondary">¿No tienes una cuenta?</span>{' '}
              <Link href={'./register'} style={{ textDecoration: 'none' }}>
                Registrate aquí.
              </Link>
            </TextBodyTiny>
          </GridItem>
        </GridContainer>
      </CardAuth>
    </BoxContentCenter>
  ) : (
    <BoxContentCenter>
      <div>Loading...</div>
    </BoxContentCenter>
  );
}
