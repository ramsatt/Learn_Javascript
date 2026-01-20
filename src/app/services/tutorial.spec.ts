import { TestBed } from '@angular/core/testing';

import { Tutorial } from './tutorial';

describe('Tutorial', () => {
  let service: Tutorial;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tutorial);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
