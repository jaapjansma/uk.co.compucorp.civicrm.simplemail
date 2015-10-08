#Simple Mail

Simple Mail is a simplified version of CiviMail. It allows building mailings in 4 simple steps.

With Simple Mail, you can create Mailing Header images, and Campaign Messages, which can be used within the mailing. It allows email duplication as well, which can be done from the mailing listing.

It works in a similar way to CiviMail, with the additional option of adding a seperate unsubscribe groups to mailings being created.

##Installation

Download extension from https://github.com/compucorp/uk.co.compucorp.civicrm.simplemail

Unzip the package and place it in your extensions directory. 

Refresh Manage Extensions page and the new “SimpleMail” extension should be listed. Then click on install.

In menu now a 'Mailing' tab should be seen.

##Usage

Before creating a mailing, setup a CiviCRM Group with `Mailing List` as Group Type, and add required contacts to it. You would then be able to select this group as recipient while creating a mailing.

Next, you should create a group, to act as unsubscribe category. This can be done the same way as creating a group as above, except that Group Type should be set as `Mailing Category`, in addition to `Mailing List`.

Start creating your mailing by selecting the Unsubscription Category and Mailing Recipients (Mailing Group). Alternatively Simple Mail can be created with recipients from search results.

Compose your mailing with body content, header image, campaign message etc. Preview, test and then send mailing immediately or schedule.

A list of mailings can be viewed in a single page and can be filtered with 'Mailing Status' and also 'Created by'.