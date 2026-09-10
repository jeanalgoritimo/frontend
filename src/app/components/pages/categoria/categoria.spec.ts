import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaPage } from './categoria';

describe('CategoriaPage', () => {
  let component: CategoriaPage;
  let fixture: ComponentFixture<CategoriaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaPage],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriaPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
