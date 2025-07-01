import React from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";

const QuickTransfer = () => {
  return (
    <div className='card radius-16'>
      <div className='card-header'>
        <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
          <h6 className='mb-2 fw-bold text-lg mb-0'>Quick Transfer</h6>
        </div>
      </div>
      <div className='card-body p-0'>
        <div className='py-16 px-24'>
          <form action='#'>
            <div className=''>
              <label
                htmlFor='message'
                className='d-block fw-semibold text-primary-light mb-8'
              >
                Write Short Description
              </label>
              <textarea
                className='form-control'
                id='message'
                rows={4}
                cols={50}
                placeholder='Enter a description...'
                defaultValue={""}
              />
            </div>
            <div className='mt-16'>
              <label
                htmlFor='Amount'
                className='d-block fw-semibold text-primary-light mb-8'
              >
                Amount
              </label>
              <div className='d-flex gap-16'>
                <input
                  type='text'
                  id='Amount'
                  className='form-control form-control-lg'
                  placeholder='Ex: $200'
                />
                <button
                  className='btn btn-primary-600 flex-shrink-0 d-flex align-items-center gap-2 px-32'
                  type='submit'
                >
                  Send <i className='ri-send-plane-fill' />{" "}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickTransfer;
