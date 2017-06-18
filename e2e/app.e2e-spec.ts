import { FccCoordinationAppPage } from './app.po';

describe('fcc-coordination-app App', () => {
  let page: FccCoordinationAppPage;

  beforeEach(() => {
    page = new FccCoordinationAppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
