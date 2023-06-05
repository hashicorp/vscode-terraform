import { expect } from 'chai';
import {
  ActivityBar,
  CustomTreeSection,
  SideBarView,
  ViewContent,
  ViewTitlePart,
  WelcomeContentSection,
} from 'vscode-extension-tester';

describe('Terraform Cloud View', () => {
  let titlePart: ViewTitlePart;
  let content: ViewContent;

  before(async () => {
    // make sure the view is open
    (await new ActivityBar().getViewControl('HashiCorp Terraform CLoud'))?.openView();

    // now to initialize the view
    // this object is basically just a container for two parts: title & content
    const view = new SideBarView();
    titlePart = view.getTitlePart();
    content = view.getContent();
  });

  it('has the correct title', async () => {
    const title = await titlePart.getTitle();
    expect(title.toLowerCase()).equals('hashicorp terraform cloud');
  });

  describe('Content', () => {
    // the content part is split into an arbitrary number of sections
    // each section may have a different layout
    let workspaces: CustomTreeSection;
    let runs: CustomTreeSection;

    before(async () => {
      // TODO? workspaces = (await content.getSection('workspaces')) as CustomTreeSection;
      workspaces = (await content.getSections())[0] as CustomTreeSection;
      runs = (await content.getSections())[1] as CustomTreeSection;
    });

    it('Look at the items', async () => {
      const welcome: WelcomeContentSection | undefined = await workspaces.findWelcomeContent();

      // get all the possible buttons and paragraphs in a list
      const contents = await welcome?.getContents();
      console.log('🚀 ~ file: act-test.ts:61 ~ it ~ contents:', contents);

      // get all buttons
      const btns = await welcome?.getButtons();
      console.log('🚀 ~ file: act-test.ts:65 ~ it ~ btns:', btns);
    });
  });
});
