<p><a href="">Add new campaign message</a></p>

{if $messages}
    <div>
        {include file="CRM/common/enableDisable.tpl"}
        <table class="selector">
            <tr class="columnheader">
                <th>{ts}ID{/ts}</th>
                <th>{ts}Label{/ts}</th>
                <th>{ts}Text{/ts}</th>
                <th>{ts}Is active{/ts}</th>
                <th></th>
            </tr>
            {foreach from=$messages item=message}
                <tr id="row_{$message.id}"
                    class="{cycle values="odd-row,even-row"} {if NOT $message.is_active} disabled{/if}">
                    <td class="crm-simplemail-message-id">{$message.id}</td>
                    <td class="crm-simplemail-message-label">{$message.label}</td>
                    <td class="crm-simplemail-message-text">{$message.text}</td>
                    <td class="crm-simplemail-message-active">{$message.is_active}</td>
                    <td>{$message.action|replace:'xx':$message.id}</td>
                </tr>
            {/foreach}
        </table>
   </div>
{/if}

<p><a href="">Add new campaign message</a></p>

{* Example: Display a translated string -- which happens to include a variable *}
<p>{ts 1=$currentTime}(In your native language) The current time is %1.{/ts}</p>

{*
 +--------------------------------------------------------------------+
 | CiviCRM version 4.4                                                |
 +--------------------------------------------------------------------+
 | Copyright CiviCRM LLC (c) 2004-2013                                |
 +--------------------------------------------------------------------+
 | This file is a part of CiviCRM.                                    |
 |                                                                    |
 | CiviCRM is free software; you can copy, modify, and distribute it  |
 | under the terms of the GNU Affero General Public License           |
 | Version 3, 19 November 2007 and the CiviCRM Licensing Exception.   |
 |                                                                    |
 | CiviCRM is distributed in the hope that it will be useful, but     |
 | WITHOUT ANY WARRANTY; without even the implied warranty of         |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.               |
 | See the GNU Affero General Public License for more details.        |
 |                                                                    |
 | You should have received a copy of the GNU Affero General Public   |
 | License and the CiviCRM Licensing Exception along                  |
 | with this program; if not, contact CiviCRM LLC                     |
 | at info[AT]civicrm[DOT]org. If you have questions about the        |
 | GNU Affero General Public License or the licensing of CiviCRM,     |
 | see the CiviCRM license FAQ at http://civicrm.org/licensing        |
 +--------------------------------------------------------------------+
*}
{if $action eq 1 or $action eq 2 or $action eq 8}
    {include file="CRM/Admin/Form/Resource.tpl"}
{else}
    {if $rows}
        <div id="ltype">
            {strip}
                {* handle enable/disable actions*}
                {include file="CRM/common/enableDisable.tpl"}
                <table class="selector">
                    <tr class="columnheader">
                        <th>{ts}ID{/ts}</th>
                        <th>{ts}Label{/ts}</th>
                        <th>{ts}Text{/ts}</th>
                        <th>{ts}Is active{/ts}</th>
                        <th></th>
                    </tr>
                    {foreach from=$rows item=row}
                        <tr id="row_{$row.id}"
                            class="crm-booking_resource {cycle values="odd-row,even-row"} {$row.class}{if NOT $row.is_active} disabled{/if}">
                            <td class="crm-booking-resource-name">{$row.id}</td>
                            <td class="crm-booking-resource-description">{$row.label}</td>
                            <td class="crm-booking-resource-type">{$row.text}</td>
                            <td class="crm-booking-resource-location">{$row.is_active}</td>
                            <td>{$row.action|replace:'xx':$row.id}</td>
                        </tr>
                    {/foreach}
                </table>
            {/strip}

            {if $action ne 1 and $action ne 2}
                <div class="action-link">
                    <a href="{crmURL q="action=add&reset=1"}" id="new" class="button"><span><div
                                    class="icon add-icon"></div>{ts}Add Resource{/ts}</span></a>
                </div>
            {/if}
        </div>
    {elseif $action ne 1}
        <div class="messages status no-popup">
            <div class="icon inform-icon"></div>
            {ts}There are no resources.{/ts}
        </div>
        <div class="action-link">
            <a href="{crmURL p='civicrm/admin/resource' q="action=add&reset=1"}" id="newResource" class="button"><span><div
                            class="icon add-icon"></div>{ts}Add Resource{/ts}</span></a>
        </div>
    {/if}
{/if}