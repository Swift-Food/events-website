import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organiser Terms and Conditions | Prismo",
  description: "Terms and conditions for event organisers using the Prismo platform",
};

export default function OrganizerTermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Organiser Terms and Conditions
        </h1>

        <div className="prose prose-invert max-w-none space-y-8 text-foreground/90">
          <p className="text-muted-foreground">
            This website (Site) is operated by Swift Food Services Ltd (company number 16457702) (we, our or us).
            These Ticket Sales Terms and Conditions (Terms) apply to your use of our platform to create, manage and
            sell tickets for events via the Site.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Platform and Our Role</h2>
            <p className="text-muted-foreground">
              We provide a platform enabling you, as an organiser (Organiser), to manage and promote events and to
              sell tickets to attendees (Attendees). We are not the seller of tickets – the contract for the sale
              of each ticket is between you and the Attendee. We facilitate the transaction and provide the platform services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Responsibilities as an Organiser</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Event Information</h3>
            <p className="text-muted-foreground">
              You must ensure that all information you provide about your event (including event descriptions, dates,
              times, venue details, ticket prices, age restrictions, and any other material information) is accurate,
              complete, up-to-date and not misleading. You must update this information promptly if anything changes.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Compliance with Laws</h3>
            <p className="text-muted-foreground mb-3">
              You are solely responsible for ensuring that your event and all aspects of how you conduct it comply
              with all applicable laws, regulations, and licensing requirements. This includes but is not limited to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Obtaining all necessary licences, permits and authorisations required to host your event (including
                venue licences, entertainment licences, alcohol licences, food safety certificates, public liability
                insurance, safeguarding requirements for events involving minors, and any other permits required by
                local authorities)
              </li>
              <li>Complying with health and safety legislation and conducting appropriate risk assessments</li>
              <li>
                Complying with all data protection laws (including the UK GDPR and Data Protection Act 2018) in
                respect of any Attendee personal data you collect or process
              </li>
              <li>Complying with consumer laws and consumer protection legislation</li>
              <li>Ensuring accessibility requirements are met where applicable</li>
              <li>Complying with any venue-specific requirements and restrictions</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              You must provide us with evidence of any required licences, permits or insurance upon our reasonable request.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Event Delivery</h3>
            <p className="text-muted-foreground">
              You are solely responsible for delivering your event as described and ensuring Attendees receive the
              experience they have paid for. This includes managing event capacity, health and safety, admissions,
              security, and dealing with any issues that arise at the event.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Prohibited Events</h3>
            <p className="text-muted-foreground mb-3">You must not use the Site to promote or host events that:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Are unlawful or fraudulent</li>
              <li>Involve the sale of illegal goods or services</li>
              <li>Promote hate speech, discrimination, or violence</li>
              <li>Involve inappropriate content relating to minors</li>
              <li>Infringe third party intellectual property rights</li>
              <li>Otherwise breach our Community Standards (available on the Site)</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We reserve the right to remove any event listing that we reasonably believe breaches these Terms or
              is otherwise inappropriate, without liability to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Payment Processing</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Payment Methods</h3>
            <p className="text-muted-foreground mb-3">
              We offer payment processing services through third-party payment processors (such as Stripe Connect).
              When you use our payment processing services:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>We act as your limited payment agent to collect ticket payments from Attendees on your behalf</li>
              <li>Payments are processed in accordance with the third-party payment processor&apos;s terms and conditions</li>
              <li>We are not regulated by the Financial Conduct Authority (FCA)</li>
              <li>You authorise us to receive, hold and process payments on your behalf using our third-party payment processor</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Fees</h3>
            <p className="text-muted-foreground">
              You will pay us the fees for use of the Site as set out on the Site or as otherwise agreed between us
              in writing (Platform Fees). Platform Fees will be deducted from ticket sales proceeds before payment is
              made to you. You may choose whether Platform Fees are absorbed by you (and included in your ticket price)
              or passed on to Attendees as a separate charge. You acknowledge that we may also charge transaction fees,
              payment processing fees, or other ancillary fees as notified to you.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Payout of Event Proceeds</h3>
            <p className="text-muted-foreground mb-3">
              Subject to these Terms, we will pay out your event proceeds (being the ticket sales revenue less our
              Platform Fees and any other applicable fees) in accordance with the payout schedule set out on the Site
              or as otherwise agreed with you. We may withhold payment of event proceeds if:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>We reasonably believe there has been fraudulent activity related to your event</li>
              <li>We have received a significant number of Attendee complaints or refund requests</li>
              <li>Your event has been cancelled and refunds are due to Attendees</li>
              <li>You are in breach of these Terms</li>
              <li>We are required to do so by law or by any regulatory authority</li>
              <li>There is a dispute regarding the event proceeds</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Chargebacks and Refunds</h3>
            <p className="text-muted-foreground">
              You acknowledge that Attendees may be entitled to refunds in certain circumstances (as set out in our
              Ticket Sales Terms and Conditions) and you authorise us to process such refunds from your event proceeds.
              If we have already paid out proceeds to you and a chargeback or refund is subsequently requested, you
              authorise us to deduct the refunded amount (plus any associated fees) from future payouts or, if necessary,
              you will reimburse us within 14 days of our request.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Taxes</h3>
            <p className="text-muted-foreground">
              You are solely responsible for determining and paying any taxes applicable to your ticket sales and event,
              including VAT, income tax, corporation tax, or any other taxes. We may be required to collect and remit
              certain taxes on ticket sales in accordance with applicable law, in which case we will notify you. All
              ticket prices you set must comply with UK tax laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Event Cancellations, Rescheduling and Refunds</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Your Cancellation Obligations</h3>
            <p className="text-muted-foreground mb-3">If you need to cancel or reschedule your event, you must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Notify us and all Attendees as soon as reasonably possible through our platform</li>
              <li>Work with Attendees in good faith to find resolutions</li>
              <li>Comply with your legal obligations to provide refunds to Attendees where applicable under consumer law</li>
              <li>
                Clearly communicate to Attendees their options (such as receiving a refund, transferring their ticket
                to a rescheduled date, or receiving an alternative offering)
              </li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Processing Refunds</h3>
            <p className="text-muted-foreground">
              If you cancel or reschedule your event and Attendees are entitled to refunds, you authorise us to process
              those refunds on your behalf. We will deduct refunded amounts from your event proceeds (whether paid or
              unpaid). If proceeds are insufficient to cover refunds due, you must pay us any shortfall within 14 days.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Platform Fees on Cancelled Events</h3>
            <p className="text-muted-foreground">
              If your event is cancelled, we reserve the right to retain Platform Fees already charged to cover our
              costs in processing the original transaction and any refunds, unless the cancellation was due to an
              error on our part.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">No Liability for Cancellations</h3>
            <p className="text-muted-foreground">
              We will not be liable for any losses you suffer as a result of cancelling, rescheduling or relocating
              your event, including any costs you have incurred in organising the event.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Attendee Data and Privacy</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Data Controller Responsibilities</h3>
            <p className="text-muted-foreground mb-3">
              Where you collect personal data from Attendees (either through our platform or otherwise), you are a
              data controller and must comply with all applicable data protection laws. Your responsibilities include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Having a lawful basis for processing Attendee personal data</li>
              <li>Providing Attendees with appropriate privacy information</li>
              <li>Responding to Attendees&apos; data subject rights requests</li>
              <li>Implementing appropriate security measures</li>
              <li>Only using Attendee data for legitimate purposes related to your event</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Our Role as Data Processor</h3>
            <p className="text-muted-foreground">
              Where we process Attendee personal data on your behalf (for example, when collecting registration
              information through the Site), we act as your data processor. We will process such data in accordance
              with our Privacy Policy, our Data Processing Agreement and applicable data protection laws. We may use
              Attendee data for our own purposes (such as platform analytics and improvement) in accordance with our
              Privacy Policy, in which case we act as a separate data controller.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Data Sharing</h3>
            <p className="text-muted-foreground">
              You must not share or sell Attendee personal data to third parties for marketing purposes without
              obtaining appropriate consent from Attendees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Content and Intellectual Property</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Content You Provide</h3>
            <p className="text-muted-foreground mb-3">
              You are solely responsible for all content you upload to or provide through the Site, including event
              descriptions, images, videos, promotional materials and your organisation&apos;s branding (Your Content).
              You warrant that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You own or have the necessary rights to use and license Your Content</li>
              <li>Your Content does not infringe any third party intellectual property rights or other rights</li>
              <li>Your Content is accurate and not misleading</li>
              <li>Your Content complies with all applicable laws and these Terms</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Licence to Us</h3>
            <p className="text-muted-foreground mb-3">
              You grant us a non-exclusive, worldwide, royalty-free, transferable, sublicensable licence to use,
              reproduce, modify, display, distribute and create derivative works from Your Content for the purposes of:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Operating the Site and providing our services to you</li>
              <li>
                Promoting your event on the Site and through our marketing channels (including social media, email
                marketing, and third-party distribution partners)
              </li>
              <li>
                Promoting our platform and services (including using your event as a case study or testimonial with
                your permission)
              </li>
              <li>Our internal business purposes</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              This licence continues for a reasonable period after your event has ended to allow us to maintain records
              and complete our services to you.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Your Trademarks</h3>
            <p className="text-muted-foreground">
              You grant us a licence to use your name, logo and trademarks in connection with promoting your event and
              identifying you as a customer of our platform, both on the Site and in our marketing materials.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Our Intellectual Property</h3>
            <p className="text-muted-foreground">
              All intellectual property rights in the Site and our platform (including our software, designs, logos and
              branding) belong to us. You must not copy, modify, reproduce, distribute or create derivative works from
              any part of our platform. You may not remove or alter any proprietary notices on the Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Third Party Sites</h2>
            <p className="text-muted-foreground">
              The Site may contain links to websites operated by third parties. Unless we tell you otherwise, we do not
              control, endorse or approve, and are not responsible for, the content on those websites. We recommend that
              you make your own investigations with respect to the suitability of those websites. If you purchase goods
              or services from a third-party website linked from the Site, such third party provides the goods and
              services to you, not us.
            </p>
            <p className="text-muted-foreground mt-3">
              We may receive a benefit (which may include a referral fee or a commission) should you visit certain
              third-party websites via a link on the Site (Affiliate Link) or for featuring certain products or services
              on the Site. We will make it clear by notice to you which (if any) products or services we receive a benefit
              to feature on the Site, or which (if any) third party links are Affiliate Links.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Account</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Account Security</h3>
            <p className="text-muted-foreground mb-3">If you create an Organiser account, you must:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete information about yourself or your organisation</li>
              <li>Keep your password and account details confidential</li>
              <li>Notify us immediately of any unauthorised use of your account</li>
              <li>Ensure that any sub-users or team members you grant access to your account comply with these Terms</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              You are responsible for all activities that occur under your account.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Account Suspension or Termination</h3>
            <p className="text-muted-foreground mb-3">
              We may suspend or terminate your account and your access to the Site at any time if:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You breach these Terms</li>
              <li>You engage in fraudulent activity or misuse the platform</li>
              <li>Your events repeatedly result in Attendee complaints or disputes</li>
              <li>Continuing to provide services to you would expose us to legal liability or reputational harm</li>
              <li>We decide to cease offering the services</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We will endeavour to give you reasonable notice before terminating your account (unless immediate
              termination is necessary to protect the platform or our users), but we are not obligated to do so. Upon
              termination, we will pay out any event proceeds due to you (less any amounts we are entitled to withhold
              or deduct under these Terms).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground mb-3">
              In order to provide our services on a large scale, we need to limit our liability to you.
            </p>
            <p className="text-muted-foreground mb-3">
              Nothing in these Terms limits any Liability which cannot legally be limited, including Liability for death
              or personal injury caused by negligence, fraud or fraudulent misrepresentation, breach of the terms implied
              by section 2 of the Supply of Goods and Services Act 1982 (title and quiet possession), and defective
              products under the Consumer Protection Act 1987.
            </p>
            <p className="text-muted-foreground mb-3">
              Except where we can&apos;t limit our liability at law, to the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Our maximum liability arising from or in connection with the Terms will be limited to, and must not
                exceed, the Platform Fees paid by you to us in the three months immediately preceding the circumstances
                giving rise to your claim
              </li>
              <li>
                We will not be liable to you for any loss of profit, loss of business, loss of data, business
                interruption, or loss of business opportunity, however arising, whether under statute, contract, equity,
                tort (including negligence), indemnity or otherwise
              </li>
            </ul>
            <p className="text-muted-foreground mt-3 mb-3">We will have no liability for:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The quality, safety, legality or success of your event</li>
              <li>
                Any acts or omissions by you, your staff, contractors or any third parties involved in your event
                (including venues, suppliers, performers or security)
              </li>
              <li>Any injury, loss or damage suffered by Attendees at your event</li>
              <li>Any failure by you to obtain required licences, permits or insurance</li>
              <li>Loss or corruption of any data or content you upload to the Site</li>
              <li>Any breach by you of these Terms or applicable laws</li>
              <li>
                The Site or services being unavailable due to maintenance, updates or circumstances beyond our control
              </li>
              <li>
                Any event or circumstance beyond our reasonable control (including failures of third-party services
                such as payment processors)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Warranties and Disclaimers</h2>
            <p className="text-muted-foreground mb-3">
              To the extent permitted by law, the Site and our services are provided on an &quot;as is&quot; and
              &quot;as available&quot; basis.
            </p>
            <p className="text-muted-foreground mb-3">You acknowledge that:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>We have no control over and are not responsible for the conduct of Attendees</li>
              <li>We are not liable for payment fraud, chargebacks or disputes between you and Attendees</li>
              <li>We do not guarantee any level of ticket sales for your event</li>
              <li>We may need to suspend or modify the Site from time to time for maintenance or improvements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Indemnity</h2>
            <p className="text-muted-foreground mb-3">
              You agree to indemnify, defend and hold harmless Swift Food Services Ltd, our affiliates, and our respective
              officers, directors, employees, agents and contractors (together, the Swift Released Parties) from and
              against any and all claims, liabilities, damages, losses, costs and expenses (including reasonable legal
              fees) arising from or relating to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Your breach of these Terms</li>
              <li>
                Your event and any injuries, losses or damages suffered by Attendees or third parties in connection
                with your event
              </li>
              <li>Your Content or any claim that Your Content infringes third party rights</li>
              <li>Your failure to obtain or maintain required licences, permits, insurance or authorisations</li>
              <li>Your breach of any applicable laws or regulations</li>
              <li>Any disputes between you and Attendees</li>
              <li>Your collection, use or processing of Attendee personal data</li>
              <li>Our processing of refunds or chargebacks on your behalf</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              This indemnity will not apply to the extent that any claim arises from our gross negligence or wilful
              misconduct.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">General</h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Amendment</h3>
            <p className="text-muted-foreground">
              We may, at any time and at our discretion, vary these Terms by publishing varied terms on the Site. Prior
              to placing an order, we recommend you carefully read the terms that are in effect at that time to ensure
              you understand and agree to them. For any order that has been accepted by us, the terms and conditions that
              apply will be the ones that were in effect (and which you agreed to) when you placed your order.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Assignment</h3>
            <p className="text-muted-foreground">
              You must not assign any rights or obligations under these Terms, whether in whole or in part, without our
              prior written consent.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Disputes</h3>
            <p className="text-muted-foreground">
              A Party may not commence court proceedings relating to any dispute arising from, or in connection with,
              this Agreement (Dispute) without first meeting a representative of the other Party within 10 days of
              notifying that other Party of the Dispute. If the Parties cannot resolve the Dispute at that meeting,
              either Party may refer the Dispute to mediation administered by the Centre for Effective Dispute Resolution.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Feedback and Complaints</h3>
            <p className="text-muted-foreground">
              We are always looking to improve our services. If you have any feedback or a complaint, please notify us
              on our contact details below and we will take reasonable steps to address any concerns you have.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Governing Law</h3>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of England and Wales. Each Party irrevocably and unconditionally
              submits to the exclusive jurisdiction of the courts operating in England and Wales and any courts entitled
              to hear appeals from those courts and waives any right to object to proceedings being brought in those courts.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Notices</h3>
            <p className="text-muted-foreground">
              Any notice given under these Terms must be in writing addressed to us at the details set out below or to
              you at the details provided when you submitted your order. Any notice may be sent by standard post or email,
              and will be deemed to have been served on the expiry of 48 hours in the case of post, or at the time of
              transmission in the case of transmission by email.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Relationship of Parties</h3>
            <p className="text-muted-foreground">
              These Terms are not intended to create a partnership, joint venture or agency relationship between the parties.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Severance</h3>
            <p className="text-muted-foreground">
              If a provision of these Terms is held to be void, invalid, illegal or unenforceable, that provision is to
              be read down as narrowly as necessary to allow it to be valid or enforceable, failing which, that provision
              (or that part of that provision) will be severed from these Terms without affecting the validity or
              enforceability of the remainder of that provision or the other provisions.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Waiver</h3>
            <p className="text-muted-foreground">
              Any failure or delay by a party in exercising a power or right (either wholly or partly) in relation to
              these Terms does not operate as a waiver or prevent a party from exercising that power or right or any
              other power or right. A waiver must be in writing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-3">For any questions and notices, please contact us at:</p>
            <div className="text-muted-foreground">
              <p className="font-medium text-foreground">Swift Food Services Ltd</p>
              <p>Email: support@prismo.live</p>
              <p>Address: 251 Gray&apos;s Inn Road, London, England, WC1X 8QT</p>
            </div>
          </section>

          <div className="border-t border-foreground/10 pt-6 mt-8">
            <p className="text-sm text-muted-foreground">Last update: 19 December 2025</p>
            <p className="text-sm text-muted-foreground mt-1">&copy; LegalVision Law UK Ltd</p>
          </div>
        </div>
      </div>
    </div>
  );
}
