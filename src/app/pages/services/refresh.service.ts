import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RefreshService {

  constructor() { }

  public refreshPageOnce(key : string): void {
    const hasRefreshed = localStorage.getItem(key);
    if (!hasRefreshed) {
      localStorage.setItem(key, 'true');
      window.location.reload();
    }
  }

  public resetRefreshFlag(key : string): void {
    localStorage.removeItem(key);
  }
}
