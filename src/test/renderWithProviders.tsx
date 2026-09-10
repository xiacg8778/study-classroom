import {render,type RenderResult} from '@testing-library/react';import type {ReactElement} from 'react';import {MemoryRouter} from 'react-router-dom';import {ThemeProvider} from '@mui/material';import {theme} from '../theme/theme';
export function renderWithProviders(ui:ReactElement):RenderResult{return render(<ThemeProvider theme={theme}><MemoryRouter>{ui}</MemoryRouter></ThemeProvider>);}
