// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element ID when selecting an element. Create one if none.
// ***************************************************************

// Group: @multi_team_and_dm

import {getAdminAccount} from '../../support/env';

describe('Multi Team and DM', () => {
    let testChannel;
    let testTeam;
    let testUser;
    let otherUser;
    const sysadmin = getAdminAccount();

    before(() => {
        // # Setup with the new team, channel and user
        cy.apiInitSetup().then(({team, channel, user}) => {
            testTeam = team;
            testChannel = channel;
            testUser = user;

            // # Create otherUser
            cy.apiCreateUser().then(({user: user2}) => {
                otherUser = user2;
            });

            // # Login with testUser and visit test channel
            cy.apiLogin(testUser);
            cy.visit(`/${testTeam.name}/channels/${testChannel.name}`);
        });
    });

    it('MM-T439 Town Square is not marked as unread for existing users when a new user is added to the team', () => {
        // # Disable join/ leave messages for testUser
        cy.findByLabelText('main menu').click();
        cy.findByText('Account Settings').click();
        cy.findByLabelText('advanced').click();
        cy.findByText('Enable Join/Leave Messages').click();
        cy.get('#joinLeaveOff').click();
        cy.findByText('Save').click();
        cy.get('#accountSettingsHeader').within(() => {
            cy.findByLabelText('Close').click();
        });

        // # Confirm Town Square is marked as read
        cy.findByLabelText('town square public channel').should('be.visible');

        // # Remove focus from Town Square
        cy.findByLabelText('off-topic public channel').click();

        // # Add second user to team in external session
        cy.externalRequest({user: sysadmin, method: 'post', path: `teams/${testTeam.id}/members`, data: {team_id: testTeam.id, user_id: otherUser.id}});

        // * Assert that Town Square is still marked as read after second user added to team
        cy.findByLabelText('town square public channel').should('be.visible');

        // * Switch to different channel and assert that Town Square is still marked as read
        cy.findByText(`${testChannel.display_name}`).click();
        cy.findByLabelText('town square public channel').should('not.have.css', 'font-weight', '600');
    });
});
