import React from 'react'

const page = () => {
  return (
    <div className='w-full'>
      <div className='mx-auto max-w-[800px] md:pt-10 p-4'>
        <h1 className='text-2xl font-creato text-black '>Terms and Conditions</h1>
        <p className='text-xs text-gray-500 mt-2'>Effective Date: March 23, 2026</p>
        <section>
          <p className='text-sm text-gray-500 mt-3'>
            Welcome to Vichento (“we,” “our,” or “us”). These Terms and Conditions govern your use of our website <span className='text-black font-semibold'>www.vichento.com.</span> <br />
            <br />
            By accessing or using Vichento, you agree to comply with and be bound by these Terms. If you do not agree, please do not use our platform.
          </p>
        </section>

        <section>
          <div>
            <h2 className='font-bold mt-3 font-creato'>1. Eligibility</h2>
            <p className='text-sm mt-2 text-gray-500'>
              By using Vichento, you confirm that:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-gray-500 '>
              <li>You are at least 13 years old</li>
              <li>You have the legal capacity to enter into these Terms</li>

            </ul>
          </div>
        </section>
        <section>
          <div>
            <h2 className='font-bold mt-3 font-creato'>2. User Accounts</h2>
            <p className='text-sm mt-2 text-gray-500'>
              To access certain features, you may need to create an account.

              <br />
              You agree to:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-gray-500 '>
              <li>Provide accurate and complete information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Be responsible for all activities under your account</li>

            </ul>
            <p className='text-sm mt-2 text-gray-500'>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </div>

        </section>
        <section>
          <div>
            <h2 className='font-bold mt-3 font-creato'>3. User-Generated Content</h2>
            <p className='text-sm mt-2 text-gray-500'>
              Vichento allows users to create and share content, including articles, comments, and other materials.

              <br />
              By posting content, you:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-gray-500 '>
              <li>Retain ownership of your content</li>
              <li>Grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the platform</li>
            </ul>
            <p className='text-sm mt-2 text-gray-500'>You are solely responsible for the content you publish.</p>
          </div>
        </section>


        <section>
          <div>
            <h2 className='font-bold mt-3 font-creato'>4. Prohibited Activities</h2>
            <p className='text-sm mt-2 text-gray-500'>
              You agree NOT to:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-gray-500 '>
              <li>Post illegal, harmful, or abusive content</li>
              <li>Upload copyrighted material without permission</li>
              <li>Engage in spam, scams, or misleading practices</li>
              <li>Attempt to hack, disrupt, or damage the platform</li>
              <li>Impersonate others or provide false information</li>
            </ul>
            <p className='text-sm mt-2 text-gray-500'>We reserve the right to remove content and take action against violations.</p>
          </div>
        </section>


        <section>
          <div>
            <h2 className='font-bold mt-3 font-creato'>5. Content Moderation</h2>
            <p className='text-sm mt-2 text-gray-500'>
              We may:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-gray-500 '>
              <li>Review, remove, or restrict content that violates our policies</li>
              <li>Suspend or ban users at our discretion</li>
            </ul>
            <p className='text-sm mt-2 text-gray-500'>However, we are not obligated to monitor all content.</p>
          </div>
        </section>

        
        <section>
          <div>
            <h2 className='font-bold mt-3 font-creato'>6. Intellectual Property </h2>
            <p className='text-sm mt-2 text-gray-500'>
            All platform content (excluding user-generated content), including:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-gray-500 '>
              <li>Logo</li>
              <li>Design</li>
              <li>Features</li>
              <li>Branding</li>
            </ul>
            <p className='text-sm mt-2 text-gray-500'>is owned by Vichento and protected by applicable laws.
              <br />
              You may not copy, reproduce, or distribute without permission.
            </p>
          </div>
        </section>
          
        <section>
          <div>
            <h2 className='font-bold mt-3 font-creato'>7. Third-Party Services</h2>
            <p className='text-sm mt-2 text-gray-500'>
            All platform content (excluding user-generated content), including:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-gray-500 '>
              <li>Logo</li>
              <li>Design</li>
              <li>Features</li>
              <li>Branding</li>
            </ul>
            <p className='text-sm mt-2 text-gray-500'>is owned by Vichento and protected by applicable laws.
              <br />
              You may not copy, reproduce, or distribute without permission.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default page