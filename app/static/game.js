/**
 * Beatstar 120 FPS High-Performance Canvas Rhythm Engine
 * Fixed 3-Lane Rhythm Game with Direct Audio Playback & Sub-Millisecond Synchronization
 * Features:
 * - Upper-Screen Judgements (unobstructed highway)
 * - Canvas Background FX Engine synced 1:1 with song BPM (Aura, Ocean Waves, Synthwave, Aurora)
 * - Real-Time 3-Lane Collision Resolution & Multi-Lane Downsampler (4K/7K/8K -> 3K 2-finger limit)
 * - Rock-solid stability for restart, countdown and arcade revive rewinding
 */

const SFX_MISS_BASE64 = 'data:audio/wav;base64,UklGRpxgAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YXhgAAAAAEgAigD/AQYCygEBBT0IdAN1B9sDvQskDSMOuguXEF8Fjwk7BUIJGgo0FaQIFQcxGGwEExgLF2EWTwcYCSwOHB+yISIQ6xG9EWsSjghfHv0e4QtKELUV9wE8DvwEgBTGHGkjpBV7Fx4P6iGBEYkAbf45D/sJXgDNAEf51RPvFCP1/OoODjgCRSEBEiIklxqpD4giHP23JO/wyglC+fP0EBsG9bz+zvfqADLmhe9zCSLQNNlA42/tf/xSwNi/yO5RwQP3ncyx8d/X+PP83GDYm/ZaA+TXhsR+7tbWU80E0Wro8PV59x3SU+j2sNfWNcORu9Hxjfj63tfzTaN3rGG3HKq4yIKmk7yep/XWBfa/rCLjP97PwVm8P/m2zdHXC8gf6cbj4/quC53gaO/x/q778+/I/LjrqP4+KYj+pvGR+tIBOxBlCt0/iQoBFlQimS0iBREPaxgVCY0X/QgaC/wzgw7XIKlKICydE7r7NPUBE+US3/Iy2hzt6tVj8rLgTsge0sfqicHouiPct7fK4FfyC/KJ6wUNdO2D7hkKfPso9H8eWgxuAz357B7Y+PITLy+gIn0IMQDyA3T9aPhPDxYfTxaqED0nnypV97EBwi7hKWgE3SkrB6ESuTNhE9ceEz/NKswzvSj6P2Q1uz0gQqxTTTpsU70rZk1QU0Q7i0YCVYg+dUDyNbc/tVgIHEIZxytpKhE/6jbwEHcOyfMzAl4ARvfIEb/+Q+04Emj55xLX7STpDPMc9d/i1/OD7n3PndfqzbG10sYT0Om4h7tK1orNd9nxvRLTPejR0Ru5P9VozbnLYdRw/MfryvsI9xrbTPi12Qfr6O8M5lbm7e+96Wbk6+fp8qbXT+Ra1NPrXc1gzhvXNsEl0tLbnMjErjfKdb5ptUiikJvmnRWbfr26uiWfprxZqNWgErB1tKK1QK3evw65n7dw20nGQ7wC3BrIW7rg8jrh4O1P/roEXBAUDBsieiSAFmka0TXkHVo8XyN0MYg+ckXET41h11PEYsxcsF4OaIBIf1tlS1BEMlLJVVpEyUzUSnlDQjhbP7hU81XCVa9HiUYaQss3SjedNrdMrS92PTcz0i6RMjJLUUJlQiM4VTzGQf8xaUvXMZQ1uUWDNc0vBC+XIJ4VSxT4FyABxwhg8joDW+0Q8/L0QPRe2qDhuOAl0FrY7N+G2kDcdOvd5jjjz+VB5mvm9OPky+HVK9tS2bDcydt22kbd/+Mv3ora/N+p0rrhXuMX61Pck+c24/nf2ORb8QnjNuzD4UL1pPDx6Czh1eC56Lnisexz4oHflewx8CwBhf7QAI7qHfDT5rPczdft3Q3dh9qFzXrHHcg605/Q7Mc20NjKy8250A3Chsr60B3GOs1b3Jzi9deh/N/3wfeY+ZcN/grGDO4OcAGJ/SL7IfpwAQ7+QgxmFn0RjBeGG1MP+BB4D7gewBgtPukesQ+zEIoBFCs2MBo3WSlRJTUVxQz1GqEfzxZBFBcOYRQzGXEhTBHUEvEWZSEqHlIqcCK0HZgVpxL9CFUHeweaDDMQCgTg/vABUP+rCsMBMvR9+7MDRvm7+Zf6CfhFDGEM+AlwB8cXcxHvIVAg/SOTIIMOdxNZ/gUQAvqE+v/vu+0V/d3ugu2K954Io/y/BCUYXv0gGTYhjx6+LQ4QZgySIlEaHy2vFRhFyjoESQg+Uzi8TSRPCEIbMBRGBTlzNto9sEOjSBRFHB8LIoIAzQ3JC0gDkg0NEHn4Ye3Qxp3GiMFst7bH97S7xqe1Isu72Za8Stla1KHH5MDP4K3HYM7fyanOZs1L4f/icMrb1LDa09RizTTOfbNFwHbJzbd4tkC8usduzQTM4ONd3TbjZPGd9Pzdseli6m/fv+XD3SzfafE644bqpP9O+Y3qaeOW2H/dod610knMX9PsxgPOVce1tXu9oMUbuKKzssNtsq28vMAFxvjD+8oawnu9wrzPthm2bMsTyw3eEN2G9P8DGhCDISQfIg6vDVwRoRwhIQUsLi7CKZklnDB+NdYZFiCPLe4qnh5tMrQaISfVMs4sHCOONJMtFzaJMvhATjx8RLtR1WVBWLtikklVXGhcFlJuXhJiOFytX3Za1WbLbChWXlh6YIBikmxaZHdYTVJBRkZNR0goRS9Rh0TXPCtLrUCcRa44gDazNXI1tSkHLKs0bRHwCbYF+fnSAywGx/oG+c/3p/Fe7wLi7OHH5tvTr8jK0J3Jyr/Rwi/VkMmNzh7Qr8I3z6KoeLGBs8muL6x6suKx3rLKs5q8oMAIyxLD+c4gwx/B6cMizTvRG9Zh0E7Ej83XyjbLZcSNxozLZMiQ05/RGsbB0QHG7MCjxXbEi8UdwBm6LLUytUbX+s26zBfY3NL6yyPscuW17K3xkvg+/tD8SwfTBR4BbAVICE/+Fgkm/4QD+wj4BRUIgw42CygR0QyLDEUSqAPKD+wHBwvFExAahBXuFpEZAxYuFI0TlB3OHM0jIR06HWceLBRQGAQadCGGFW0S1AyMDY8LPS5yOQA5pzITOMQ9+y9COngvzyKOKqYkxCKZIF8ZOxQQElMOEwQlB+D+wgie/hUE5gRcGZYPTRVMFiwRUxqCH4wdIxl3ImYfXBpGHHMbuBr7FmML5hEDAqz2c/U5837ynPBE793p4uRh6LTffNzz3yDmruCy6eDnu+it6EDvA+sG9DHvgPSK9Ivwlujz6OHrFOod8BDtAPFn9k/5mhY5Ft4YwA7wF7oVUhJIHqkg9CLCIZccARsZIDUmkiTGIbklSSFhIK0h4hoBHSkeSgfHCZ4PIRJ9D9oeZx91I3olcC3lIMAgKR/YFwERgQvBCY4JqwOwByT/y/na+ln8NPUp8wHkNejm5DHgCeS53MnaKtjR6S3s/O/06gDp7/Mx88734Pk/9rn1P+Ac4jffyN9H1+vVUdc42gLY990I283a/9e01vbNVM+/0O3Q2NLszLXH5Mf3xfrJA8p8xN7HW8sjxgDIoslPyQzRt9J82H3YRN4A3LLkZOZw6JDqx+h37CPlLPGc6jbsxumS6Kjv+Ohc6WDtCPTF6nPtTvZkBCUQzxN/FBgfWxN2Ew0fXxzNJOQToSjCNVg7cjfyO1JGaUegQUk7ikT2Qh1CtUTMQo48vznXKHcoPBdWHEQa3BXRGQMbngt2CAL9fgDp/+L8wwSP/KIFT/+aB1IM7QBSDWcMsQftAnoRWBVoGrAq9S5JMFQ5pjzOMu43rDtSODc4hjjXLRYz4zbDL00uby8PNm42FjS7Ns8wKDE8MLQtux8rIJkM2QUgBbz3Rvcs/Rn3hPqMA6MDHf3R+Efz7Pm/+HPla96y34bYtNmO1bTNJs8rtSCx2602tOyq960Rr6awGK52r4erVKkGqa2pAaqMs7izJLybv93JpNEt1yrfwN3N1iLXqtdv1xrZ090L5NfiwOGL58nqjuBE87r6AfuG9pL3KPLx9gD8CPhV84364vb5CjUJxwl4CJgLNRNPGHkSaBeuDNIUOxVYEJkUvxZ5FI8XiRZsHg4jix6aIjk4RTv9QNU/mjsgOvs0qDc/NbcxiylhI3kb3iAWHEodBhdFF6AWAhYhC6wLfA7W/rL6efvR8u31XPZC8RXw/uZw5FbjYN434Dj6EfIB7uXtlOr564TsU/TP7fDvJvHA7HDyHuTg2HjbVd2E4Vblr/LC9MH1Vvpi/FgAfv2VArb8+/vE/GEA9/6+AXH/NP2NAY8BNAISAOwA9QPwAr8H/gQJAdIOUAqlCO8KAgu0C3ALvgifBqMFrxJEBRYDWAXD/Rz2gQE4/AD9k/Gy86bvQu5u8kbzPPFg8370qPNz+Cr0/vVR+Jv1MPZD+Tz4yfu7+mf7ef8lFgUdvRpKHdIhcSWwJIYlxCfwJFMkpyShKXUqOjExL58wxDFRMHEy9TI3MasUeR6fGnUZPxeXIh0ikiClHCcW/xcJElEW3BHvDq4SoRA9EOUPJg1RE2QSuxBsCq8L5QeEC1kHCgnoCE0ReQz8D8wPcAmQC5AM4An9BRwIwQXmAQ0Bdf8m/pj7p/aS7bXmR+fx5hnmfdWO1HDTZdBTzezN1MY+xLjE78rpx1HHLMa3xbbF88kMyJbLQMlTy0PD+cDtvJC8U7smvae/572pvwzCir4Jy3PL2c45y4/P8c5JzpbTt9Gi3kreIdtu28reMeN/5O/lT+pZ617upgDeABgIigtLBM0HTgzjJN0kPio5K6Qt8y7IMrgtBy4dKkAnPSbmI/QivR3fGqgrcCdIJCIkLSLmHrMdlhrpFNwTWBLNFCQH+AhzCAoQYhEKE5wQmhSeGLMXLxSYFIoSXhJJCV4KsAnPCvEHXgrhCzUOEA47EWkTyBObEjESLA+FD/wP5w/UEHMOgwzUDFkMCRBdDRQLmwwFDsQLdQwXDbkMNQ7YGUocoSFhJPEjJyiZLB0uCDGtMCMyly5HK4wnfyZHFKgRXxATCwEJIwWpBcf/Ovos/NIAVAamBusFoAnHA+cC5QbwBKUK/AD38x/5+/ok+fv6aP8PAOL9JQkQDYcBBwGDAQ/9lflq92HvLOzI4xjlOeOz4Ofh5eFJ2/XZz9Zk2+jaW9mL15PTh9bs0lDVBNYizlXS6dAmzljEJMrIyCHLT9Ks1gHY0txM3yvcbd/l5sfm4ud5527z+vnhB7oG5gdWCvkO8RB1Ex4W3BQHFnkW8xVKEJIQcwUIA7ECNf0a/fD/Ff5dAFIFtQYRB7kGywUGCqQNmgaWBLgFLQPeA1kAIf2Y/T/3PfWt8y72AvLh8svx9fEh8OnvrNuB2RDYFNe51bfWdtXU177sLPDS9QLz/fVR9QT09fMT9MbzPPS/9d33qPaj9XH3t/Ys7+b24Otw7Gnr4uwA7LPvvgDpAKwAiAWHBXcPAxAtFI0U6xTTGHsbcRnLG/QhtSX5JfYjhSc1KM0mKiAJH2QhZSJvHxggHCinJk4oNycpJZodths+He8c9x4MHkocshmVHPMalRuAHWEdvhw8Gh8VqBROFTcOUQlJCYwF1gb9BpEGNwZrAjcBtwBj/qD0Rv98+9H8Z/zL+hz7XPuu/ioKNgsIDAUMlw6QCM0DqgQqBaMDpQSeCesJKAjACWQKdhB2D/QRZfy+/NX93gHsAXgG7wUzBTAA2f+h//T9r/vk+2/6U/sl+Yb2evtp9Fn6zvoz/C38zPuI+nf55vhM/qr43/dg94z05vFd99r4O/qn9sH4RviwBX8IugmKCcMKWQvACjMMkglpCdMEhwKCAaEBEgCTADb/pv698T78XP6l/HD4avnD+e368vlo+a7sMenD52boUec/4lLg69+I30reJ+Ai3fTbjM800zDRutRx0wDYp9de1evTqdES027RTtRX1oXWe9m+2/LcHN4M3pPh8+HB4YLfReDW3hbhjN/L3THeY+I04dHjBuXc4/762AaEB7UHcAoyC0cLhAwXEAsRxg8TD6UMZw8KES8SJRNaDRAOGBCSD0gc1BzeGXcPTQ9QEWIPWA6HC6cKCwpfC1IKvwuPBrsHqgTIBT8HegddB2IIgwnFCGAJJQpnCL4Llgs4A48BbQNHA68ATAMQA1UV1RUrFeEVyRcKGu4atRulHRYesR1PJegn1iolLO8oRirxK/s1ITfOOIM4mzjBMwg0ZzDlLtoo5SUzIpofvB1YGiEYMRj3FXsUcRTbE2kUVxRwE5AdRBDdDyoVag8BEPkN0hAMEWIRAhBYEbMSCRJPEJQN+g2VDQn39fYQ9t/14PMV9NzzlPTD82v0yvSV9NTzMfbw9Cn1fPUg95v3jvaM9U/1m/Rw9XXzefES8fzuY+qh6SPt4+Lg4k/n/ecI6pvsWOwM7srvPvD46mnqFO306t3o/uTE41nbh9lW2JbVSdQxzjDOjcuwynfLbM0szVzNJ83dznLZa9kZ2vbZU91y2m3WV9oU3XbemOFz6O/2dviO/2ADhgAZAvQMVgzoC8kLeQegBnkDYAReAZwAdgHWAXH/Rv/a/xcCKwKj/fb8R/tr/LL6dPv1+ej4bPqe+VP4G+6T8BrwNfFZ9Mj3Z/hl+kX7s/lADFkMtg+ED6UOfBGbE/kYHRhlGF8ZchuAE+oUdxbcF8IYwRu2G2EZWxlgFOcSKBImD1YCvAIzAXQB7AIBA8YC4f9Z/5UCJARCAYcAJAE4AKIAUP8g/oP+nPoX+tT5V/+qALEB+QHSAtMCcQMP/aH8XPwO/GH7jPV79Mf0lAWbA4cDYgHAAbcAlv8j/wn75PpC+zD8//77/h7/cgCuAHgAMQT6/5MAhAAGAAoAAgKnCUcKzAqEDT0OIxNSH70hCiC0ILciEyRYI1Uk0iY5KKMmjCXNJgszSTJeL9AuLTKIMjAxAyoWLQYsOCjxJhIlsyCJHrYM/wrICMoGhASY/47/Afht95n3HPeb9ur20vS/9Dj1dvKf8NXwSvME9KX2MfU69dfzlvOt8wbzTe8l9O/y1fNe9eT0GfUr9QX0kPid+IP4AfiZ+Bz2Wfx7/J38EfzF/E7/BgAAAHIBXAazCQYKtAsjA54DQATwBcwFbgdiBZ0EBAInBZMEkffU84jzkvKZ8r7yPvHd8lvvOfEF68nq4+nI6EDnZeQu4+LmpeOJ4qDhDtxk2jLcXdzl3erb1dMS0xnYodh42LjXPdXs1NTSJ9P20QnSf9Ar0JzQwdFk0gjUut8M4S/dceXB51Pos+cf6SDqU+si6rb60PXD9I30MfUh9WfzAPPn8IHyU/Jr87HuZu5X6f/qRerf64HrQuxz7Pbr9usZ9F/ywPIh9coCKwQdCFgKEAynDZkO5hC9Ed8VVRX4FT8UHxO5EkUSzxIFFRUV0xYOGFoYQSQKKhcr4CufLWsuzS7VMWwzzTOaMx4z3THDMi4zaTOSM+sw/zCjMS8xnjeEN5gzwi7xJScmpCR2I4UhaCAVHv0dAB3GID8egB4PHXAdQiBIIHkhriHNIfsgiiCLGrwY3xhlF1YSqw7ODRsMbgnHBk8FvwtIBxQGmgUbB0v8P/w5/ML8t/xe/G7/bgCiAeIA6QGzAr8DaAjJ+TADyAOWBFMDMwSnDaANlguzClsJUgg5BZcDWAL+AVD/Rf7d/Uj9QP0J/Yv8vgAp+wH7jf4U/Gj+wPmQ+iD6mPky+NL3W/eo9M3yivCh73buyN7y3eXcDdrD2NPZdtmP2Q3ZMtk82QzZKtwt1aDUvNSi033U8NQK1w3XetfH18fYndhx2DTa39lh2GTY/eS+4KzgXeJo4vviCeKx4ULi9uJG41rhmeFh41LjbePo4uXkm+Ic493j6+Oz5jblNOYC5n3mTObe53rouexV7b7u3/OL9Hv10/0WATP+5PzR/iEAl/vb/Jj/dwXaBUYHoQg5B8AHQQwKDP8LvQhsGGsYdhd+GY0YfRgDGTwZLxj2F/YXlhhBGLEUDRQLEyoRVRCrEC4QAxAJES4RAhtPF/IYUBlMGg4c1h2uE6MUJBdkFhIV3RT2FYUVwhSFFfQVtRfPFlUWWRd5F0sT8xItD4YMtQu5C3EKNggAB4kC7wDL/+L9Dfjn8jTyb/JV88bzi/ff9jX3G/lA+nb5fvlb/SP9af2l+yv7WvvC+aL5rPk3/Pv6yfta/DP9/P5PBykFfgXaBSkGRAYpBAcEcwQ4DLMLFw6TDSoOOQ5KDrAOkw0fDt4OCxGyEg8TYhMVFDMUAxRfFT4RhBvgGU4Z+RiGGdcf/B8sIF0hySEAJEopQB2lHPEcwh8bIHoaXhq8GoAa5BgnFpAVjBmnEEUO6gxADRsJmQe1AyMCKgLd/6j+PP3M+lL5UPEf8Mruo+0+6xfpHukk5j3mzOZA6cTptuqy6ozr+vWe9Y31Ova191D4kPn0+Nb4A/he9gL0WfNo8RrzTfJ28vXyrfK+8srykPOD9Y/1Q/I/+Vr5F/hw/Cb8zvvw+cv5WfBB8OPvMfAv7Wjua+4M72jryewF7a7tjOsh7CDroeqO7KvtO+2b57nkkeQ35GDkseRq5InlkuTo5+Dlh+en557nTedN5trlVefD5ffkJ+RQ4XjgreA54GbgMt1e0uHR8dM71FjUfdXL1BDVoNQW4w3jiuNX46TjQuQr5armz+c07UbuW/Bo9Pv12PYy92L4W/mG+2z7rgLPAHEAmvvG+Yj5ivgS+Lj1JPbi9UH2TvQm/lX8Wfqg+v/7pPz//vv/pgKPA9kH8wfhCJ0RARgwGWwbwRsMHU8eWR8CIR0iqyRSJZEkzSQ8LgcvxS/hMJ8yYjPDNNY1bTbPO40+Ez6bPn8/9j8pQoJDOURkREJE70MxQ2dEIESeQ9k/0z3MPN07WTqiOx064TNZMDEr5yn/J1om6x+WHvsVWxV3FNAWbxVDFWQURRQmFbgW4BmAGQoZJBg5FhoTuxExEf8PUw1FC2wKu/8r/p/8tvwP/bT6sPnw+P34iebm5Ufl6uS75BzkAeUk5XrlHeWe5SPmwOgR61fl3eqM60vsHOzB7Ojw/fAf8Kjv7O4M9VvyZvGf8F/uGPCO71zvKu9F71rvXO988l/wg/Ar8j3xwe3C6/rrmev87BXsc+ri6V7oOOfr5TflcOSb2gfaYNn811zYmNg32AHYqdVw1SrVztTd1brSQdFG0ebQetEH0mvTE9QK1RHWetd12G/mP+gk6XrpWupm8Dzvsu/C8AHxW/He76vvze/27/PvAe8m7dDtvO3A7Yfteu+H7sDuEO8f7D3tjOzg7LTs0eyq7DHsd+wp8JPwZ/F97yvwCfEQ9QD3YPaB9+D49PmE+HT58fqu/fkA7f+kAPAMOQzdFAcVVhVjFHwbFRxcHPcdXh4qH0whMCJ9IuAkcyUuJmQmIyUAJZwkxSOrI6YjQyP/Ij8jJCMiJ3klFSYuJsAkhyY7J+YZNhokG6sa7RmgGdoZbBnKF+QX4hd3GNgakxrCHM4cDhvqGk0ZLhmvGHEYGhGtD4oOnwcPBpMErAIP/536UPc19m71ivQl9f/zZvO+8L7wC/De8FPyJPI58n3xVPF28d3wqvLG8vbzhvIM84XzKvRG9TL5yfh7+T/6B/vB+64DTgQkBUMHngciCV0JAApcCq0KGgvgCksK3QoQDBUN6xN2FDMVuBUeFuoYnxdgHQAd+xwoGmIa6Bx1JSwlNSXWJColsyUBIOsSeRJnEfAMOwrwCe4JwgkTCQUJ3QinCgsHKQayBesFAQdlBsMEFQTBBMADNwOYAo4B7gCT/RP9gPz7++b65vq2+i752/ii+B/5yPB98L3vVO/u8l7yofFE8VXxIvFR8dbwrfBT8Lfv4e7W70Dv6PHI8QTyV/JF8kbyNPJe8vnytPEI8KryafJU9Ob1jfU49ZTyZfJV7jrv/O4E76LtAO7S7cnpAOhL6Bboj99a3krdndwy3Ive6t6z3l3cn96u3rDe7d4+4Ejg4eCQ4ALiJ+HP4crhr+F14UjfDd603ineCd4F3kTdeN063s/evt9S33fjPeQT5iHnDuhX6W/rKex87PjyQvOu8r3y8fI485XzJ/Q+AGcCuQJ0A/sEcAXkBMEE7QRMAsoCSgLaBI8D6vxj+ir5qffo9nb2U/V09W7xwfHb8lf3/vae9jf4SPkG+nP7Qfyz/Vj+/AIrA6YDYQceCegR6hKEEToS/hK9E9MUwRVdFzwYjBlRGvce+x/1IA8iZCNEJFolRSaWKD8rGy1ILeAtoy48L5YwmTFdMukyVzONOaw6mjvbO/s7qzpmOB841DdAN9A3LTeVMx0y/S+GL3Ax6zBuLiEuzSrWKsEqoS0+LlAuAC7lLRQuiypqK6wqxCmQKNUmjSPsIZsgAR/LHN4a4RdqEkQOwwz/C1wMqQqQCZwIAwiq/9D+/P1H/a386/vW+8H0Jfa09bH1wO3D7rTvUe2x797kQeWW7OHsmO6I7gDuje3p7BPv3+vv6gjqieeo59nmN+ai5Tzl5eSX5Knll+SE5BvlleUI5Bfjo+TE4SDid+Fx4NHfwd7Q3djbE9tK2r3VHtWH1OjP48/hz6/PDc4nzSTO3NPo05LUfNMa01rT9dV31vrW3deK11LYLtlA2jPbp+Gc5KflfOaN58jq5eu07LTtSO7Q7nrule677s3uuO4x7j3tou3a67Hrees67NbrBOwV9Bnz5fP+84L16vV29uf2MvfI98T5VPqR/A/8mPwr/Rz+FP/z/v35KP26/T39v/16/rj/KgGvAfoBFgcjBZcIbgiUBNcDcAZHBvkFOgYUBQ8FpgXKBcEFrwbuBuEEIgVdBpUGpQeeB5kS5hIFEygTeBOYE2cVzhQkFUIV1ROxFCQVwQ+lDmMPoA/UD0oQCxGTEaAYchk7GkEbAh0SI6kkTCUfJY8lUiWnJWEmkSa8I1ojESNSIMwfRx+LHgwdnRMME24S3xEvEaIOqw3cDJwJ6wjlB3sHVAeaBesE8wNKA9UCKQIA/9D+K/9//rb+9P4wADsC8wPSAx4EZQSeBCUHPwo6Cj8K4AmiCd0JjgluCTYJpgOFAycDLgE1AYYBqgJfBW0FjwWWBY0FgQa6BegHggdFBywGFgYCB4MK1QvfC8wLEgx8DFIKFAUpBd4FPwRWA2cDiwOQA1EDSQMqA9UDvQBCABX/Gf+E/0b/AQHbAFkBMgFNAWsBZQFxAnYB+wgfCT0J1/4C/RH9vQGXAWoBewHs/JP8BPyW+9f8W/zR+3X7+fi7+Kv4WfiX91j3/faK9tj2fvaC9133Yfd092b3i/aV9sf2Off09pb2F/hy+DT7Z/zR/D39SgO1A24CKQNTA4ED+wIVA9oC5wDQ/4X/Gf4B+oX3h/ay9f70ePUm9Zz0De6a7j7uuu5z7p3u8OvB6ynrRutl6h/q+epa6tPoV+dH5gnmVOXY5AnhYuAu4EHgSuCA4AThm+LJ4mjjR+Jp28bbetzf3tbeaeFr4UDgQuBk4KHg+uB+4ezmQejf6LXp6uoY7Uruy+5k78LuYu+G7+HwjPDm7ezsgvEp8dXwovAn8Dvwme7Y7hHuKvBK8HTwfvEw8+/z/fTJ9dv2lvf7+Xz63gTUBvAHAQz2CyMNzw2DDnIRTBIXEyoU6xTXFYAWvxg+GtMaYhv0Gz8cixxcGQMaXBm0GU0ZDxkPGNYX9hcAGP4X9xf3F0QYtRgkGVoZYRoOFVEUbBTmFd4VTBY0FtgUOxtyGlkabhpQGmQZahkzGHAYrRgyGs8aPRuKG5YabiFtIEUhayF7IWQhDCEFIKgfZR/+HlAe7hzpG9sZXRj9F0wZuxlNGSAZ/xj/GLYVWBYdFt8VmRUCE8wSkA/RDzwPyA71CuAKmAgXB3sMggdOBxUKvgZQBzcH/QbdBrUGlAhqBzYHBgcnBlsGJAZOB0EJGAnqCLgIRQizB4gHogetB90GTgbIBmYFXAXfBDUEewS7A6cBbgCs/9v+avyW+7/6MfiS9/X2kuZW5XTkaeRr5hrmGuZt5RjlZeZi54Hnbeix6GvozePx4x7kL+SB5k7nQecU5y/m+ubh5qvmrOgZ593mUOb+5b3lfuU45ZPl+uT25AfkxeN442fg/t/M3+XiLOIw4m7iwOKe4pDig+Jm4nbiJuMv4Q7izeED4gvjdePj49vjzOEl42fj6OEl4n3iE+PI4yXkseMc5qXlieet7K3rEuzy7b3uh++Y8BnxDfiU+pj7f/y+/aL+fP45/0gA1wCuAf4BFwZuBqcGTg2ODbYNkQ5pDloNfA33DGUNag4wDL0LCgwLChAKKQpbCnEKQA1wDZ0NIw3BDTYQGxJcElASfg9/D8UPPBB9EHkPQBBHED8PHQ/wDqEOXQlQBfsGkAbgBGUEYALNAVIB2/9nCPgH2QflB1YHRAcdByAHAAgICAMHOgejB5YHIQlfCf0J5gqjC5AL5gv1C/wL/Aw8DjIOMg4ODv8NKg4hDjEO+w6FC5sLlgvjCgQLQQvUCw0NKA1LDWUNugxADRMNKw43EFwQLRAxCqgQdxJbE7IT9hMWFXcVshSQEpYSyRLvDkoO+g2gDSsNjgxCC6gKJQlQB5sGpQU7BQsFpQIdA9kC5QJ1A2kDZgNYA78DTQNsBnIGcwZFA3QCbwKfA4kDdQOBA6EBjQFpAVkBAwL2AeUB5gGoBq4GwQauBmMGCAXRBIMEfAQlBPL/pP9m/3L+Lf6Y/Wn9Uv1f/Sj97fyD/aH9xf54AFgBdwHsA/gDTwFkAS4B6wBRAPH/Y/8X/mr8zvu9+pX4JPdg9tPymuil6GnoNO5463/sduzQ7ODsJO067F/sWeyO7mruie4i7x7vBO7f7rju7+747h7v4+3+7Urus+4V79jzGPUK9lj2yPZt9pzzxfMF9L7zmvOI9F/09fPO87vzvPPU8wv0YPYL93f3BvjI+Pv5gPsG/Jb8nfxW/qD+Yf9g/1n++P3g/6n/aP92/hX+6f0D/cj+Ov7g/rL+if69/gf+Gf79/gv/Mf8q/8//oP+5ABcBEgFGArwBtAHCAE/8Df3y/Nr86fwN/iD+If71/GD9b/1//Ub+XvhR+Mr22/Zb9kD20fVx9b70YPQs9Bby5fG+8arxx/EG8ljyp/Jg84Hxn/Em8qX4MPny+Xz6ffq6/e79ZP4LAGsAaQDDAI8APACUAHAB5wFGApUCWgJlBSIFowXYBRQO1w7HDo4SRxFTDyAPyA4fDpkNoQzmC6QLHQyNC1wLUQtYC3wLTgoSCEoIjAj7CVUJswl+CRAKRAp/CkgJlwnuCI0I2AzoCu8KLQwkCmkKZQpTCk4KJwkECqAJrAnACZEJ3An9CWQLcQyaDL4MiBKEEm0SeRKcErISZhIwEsMTMBMtE/wSqA7ODokOug1LDRAN0AziC6ELCQwHC84KkAqrAxoDhwFoAR8C2AGwAT8BSQCzAAIB+wAfAzwDKQNOAX0BtwHrARYDngN1BKwFbwXeBeAFyAXgAxcDzgJUAuYBcwFMAMn/g//X/mn+nf0f/aP8Bvur91P3Z/jn92n4Xvhh+Df4Gfj5+9v70PsM/C77hfto+9r6VPuV++H7H/1x/Dr9lf07/Z79EP6a/i//qASxBDH+IP7//ikBsAC9ANz79fsC/Aj7O/rF/HH9ev14/Z/9pP0//T/9af1g/Xn9XP1+/2H/Nf+1AcD/jQCFAAcAIP+v/u/9kP1s/UL7ffoL+qb4IPip98HwW/Ai8djwlfAU8KDvZvD08NXwmPAz7//u6u7s7pXw/+8u8BXw6+7R7r7up+6H7PXq1uv17IDslOwH7Bjs2OyH7Gbwd/Ci8NTwu/DL8MjwzfAo8SLxqPDp8Avx7++X8L7wGPGg8SPyXfLR8jTzofOA9Cb2pPYr96T3J/jA+EH5yPls/oD++/62BDIEpwQmBcgFYAjOCD4JqQnBCVYKnApmC5AMiA2xDWALPg4NDnwOGwwwDJYMpQwyDCgLBAtRCpAILgj1B8IHjAdQB9MG/QR7BN0DyQQxBTQFTAVzBMkEyQQ4DIEMgAx6DGoMhgxDDN4MzAy8DFoL/Ar7CnoKhQqZCsQKaAaUBr4GvgtEDHwMsQzqDBwPTA96D5EPig8KD/4ORQ5FDikPYg09DR0NrwyKDEIMIgwJDPoLyQsvDEUMHwxeDCgLNgvoCo0LKAuSCCgInQcPB8MFNAV6/6D+qv03/Sz6MvmW+FH47vbK8v7yuPNi9nj1Kfde97j37fcx+JL5uvnJ+W/+yv3Z/Rr+F/6g/f398P0M/hn+NP6+/dT8Bf3d/RX+IQCwABsBPAFnATgB/f/+/wUA1P+x/zcAFwDh/83/x//RAOoAFwEsApIC4QI+A7AD6QSjBewFMAYxBt0G5AYTB+cGQwbeBWgGcgUPBGQD+AKpAqoDOQTUA/oDzgOrA7UDYgP9A8AAwADGALUA5QC1AKL+mv9h/6r4KvjZ94n2VvRP9O3zjvNC82f4Jfjh9431gPVR9Sj15/VD8xnyUPE18d7wtPBq8Cnwyu+U73jvmu767QLuH+5e7rnuK++o72DwC/CW8E/ylPVa9rz7fPz9/NH+U//l/+kAVgGMAdsB4QHPAfsBwAHrAY0FoQWABLoFkgXABdEFQwmVCZAJvgs3C2UKTQoiCkEI+Qd8BxIH1gbjBn4GNgduBkQGJgZ7BWMEVgRRBHwCHgIxAgkCNwI9AtsCRgJSAvIBqgFTA1oCNgGHAf8B4gGkAWEBkgDh/w4Avf+h/5P/cv+N/6D/QgD6+yP8Tvxr/3kAhgCcAEP9Tv0n/f/8jf0r/fz8svym+qn6S/qz+Ub58vii+A/4zffZ92P2PvYe9jvzmfP+8gPzZvNh82rzVvML81Tzk/Ov87b05fRz9Hf6ufr3+8n9hP7//qD/agCbABUBXwGcAaEBhwGbAZEBgQFkAa/+dv5N/vD9p/1A/On7Afsz+q34cvjY+J74PPxJ/Gj8APso+wb9QP0Z/oT+ff75/kT/TQDUAEABrQF8AnoCEgN6AwYDcAPiA2AE5QR7B80HYwWxBWcGqwfTBzQIfg7fDjgPHQ8PD2EQ4xAZEUQReBGYEYYRmhEuETkRUhFSEUUSRxJDEmATiBPsE/UTxxNoE8ITZRMmE/YSZxDbD2UPLwuaCgEKqwYKBuQFvAQkBIoC5QHMAaMBPAGj/sr9ff1I/Sj9wv0A/gv+/f2A/Xf9cf1p/YX82/uq/QT/yv7H/vP97f0x/gL+lv+T/53/rP+d/6D/m/+a/7v/OwD+/wkAAwBz/7L+nf6Y/qH+pP6G/oD+c/6a/sj+T/9g/37/UfmB+cP5BfpT+p//yv8JAZsDGARyBMwEtADkASQCWwKIAocCswK0AuYCOgPrAssCnwGgAsYDxAOyAZABkwF1ASMBlABnAIYAq/9g/yT/5f6g/jH8xPvA+kb6vPnU+bH52vh3+c34o/hY+C/7CfvI+or64Pi1+Gb4dPjD+In4wfdk9y33vPaE9k/2IfYs8wHzre+Q8RLxAvH78AHx5/EC8ivyWPKF8ozy0PLU8i7z7vOa9+/3RfhY+aX53fke+ln6kPqw+gf7M/tA++v6evqN+nj6x/ql+pn5d/lJ+Rz5oPiW9z/1evUl9QT1zPMN8tfxxPGM9dXz8vNI9G/1GfVa9YX1x/UB9kj2EPc5+HH2sPi8+Br5kPnt+bf9O/6Q/vL+SP+e/7D/iv/T/7sB+gH5AlQDnQNoApYCoQI/AmYClgK0At8CVwOKCbwJAQpNCpAL6gtJDAYNdA3SDS8OZg8PEHsQrxDaEOIQWBFZEWgRThEBEc4QABGREPYPqQ94D1MPvA91EEUQcw9WDzgPKg/xDhgPng1+DV4NMg0iDesMaQuqCHgIkQWkBncG5AX2BPYE0wSIBW8FnAcDCOEH2wbCBpEGVwZ1BhgDUgKrAUQBjvwT/Af7fPrk+WD56vhT97L2YPYf9qD0jPSL9Jj0xfQJ9TL13/U394f3yfkc+lb6Ifth+6n7Jfw4/eT8H/1A/Vz9l/2u/fT9tP/6/8L/iQC+ABYBLQXgBj8HbAqHC3gLQwuBCoMKxgmvCXwJTgkwCbIIgQjKCHQIYwhbCBwIswe9B84HHgcLBygHpweaCKYI6whYB1AHEQfUBl4HwwYPBvEF3QUJBaIEOASTA/4CyQJjAicA6v/c/r3+of7I/jT3rvew9/L4WPlT+VP54ffc98L38/gk+fH41Pgy+Fv7WfsB/MX7t/if+Iv4XvhV+G344/fl9+b3Nvdj9yH3HPc39x73BPfX9oz2evZh9mn1oPWn9UT1nfeR9/f3o/jk+BT5XvnD+fL5RvqP+lH7hvux+/D7IvxQ/EH9TPxd/HH8avxm/OX70/sH+736JfoW+pD7gvsR/SL9PP2x/M/8pf3J/d39Ev4T/kf+Yv7J/ssBAAAXAFMAMwBSAFsACACc/6z/xf/l/+cA+wDw/9YAJAFxAIwAwQByAyIEVARTBFQE5QQaBSoFLwU0BSwFCwX3BKwEkwQIBO8DeANqA18D8P8HAEEAXABoAGYAuQDEAHMElQS6A7cDugMnAhUC+wG2AI0AVwHnAK4AAwBE/zD/E//X/q39Pf0G/dj86fkP+gz68vnJ+eb5ufmK+VX5Xv2h+yX8dPwX/M/7L/vm+r76avpj+i36Bfro+cj5uvm0+eP3A/hU+F34jfiA+e751vkH+j/6e/qy+tf6Avsm+5P8xvwb/Tv9Xf1l+o76wPrz+i/7iP37/Kr97P5U/7H/EwCb/tP/MQCPAOcALQGDAcUBGgJ6ApMCdQUsBcwFegbSBucGDAdCB2wHgweCB60H+gehC8ML6wsRDDIM2wvkC6kLoguOC7cLwgt7CwoLygq8CpwKzAtGCygLDAtaCk0KZgt4C6kLpgtpC10LYgtPC1QLyQvLC50KUwvvCbIKbQqDCFsILwhZCCQI7gdABwAHrAZvBhUG4AXXBQoH2AZ8BaEFuQTgAbgBAgLcAa4BmQF0AUMB6gCIAF8AJgAbAOX/T/8g/4H+Wf4W/p79ovx9/Wb9a/0A/WH8avyE/D3+AwEtAWsB/AHnAQoCHAIwAhz9Iv1X/a/9xfyI/TH8Jvwl/Br8gf2M/Yf9jP2Q/Zn9if1l/dL5kfoO+2v7hPuS+9X50vm9+S/6HfoL+u750/nW+Wv+T/47/iv+hf6A/oD+8fwA/Qv9G/2K/cD93v1W/l3+nf3E/bn9s/2b/W39SP10/jb+5/25/Zr9Ff09/Yv9fP0v/TL9O/1P/Vb9iP3E/dv98/1y/o3+k/4I/vP86fyz+yL8A/yy+zP7Evve+gH77/qt+6z7dfsr+v/5zvmh+Z75LPjY95f3d/eN9dv1+PLa8rnyoPKO8gLy3fHY8djxUvFj8S/yTfIL8kDyavLM8pj01vTm9Sj2YPbV9g/3TPec95b4ifiz+E/8Y/x+/IX8Ofro+vX6yfoG+wT7EvtJ/Oz8Bf1R/sX+wv63/nn+lf5L/Wv9h/2p/df9Sv4n/4b/ov/a/xMAMwA+AHcArwCTALcAxQUjBkcGdga+Br8I7QgHCSYJnQnuCOgIJglrCWEJswzYDOQM9gwuDU4NpQzODJsMyAzxDDINLwqKCkUK7Qo2C/8LGAyUC6cLsAtBDGUMXAxYDBcMag3LDQMO1A1uDD8M8gqpCmgKLQqoCVkJVwi2B3AHlAY8BvQFmwVIBfIEmAS9AoYC+wH1AeMBqQGaAvYCGwNgA3cDFwHdAZ7+pf65/tj/EQAMAAAA+/+F/3X/tv8q/w7/8/7P/q/+XP45/sr9k/08/dv8Y/1G/db9xP20/V79Tf2I/Xf9X/1V/Tf9L/1D/Vf9iP66/bv90v3I/d/9nv6P/nv+n/7J/vj+7f8WABk=';

const LEAD_IN_TIME = 1200; // 1.2 segundos de preparación visual (400ms por dígito)

// ==========================================
// ZERO-GC COLOR & GEOMETRY UTILITIES
// ==========================================
const _rgbaCache = new Map();
const _PROLONG_RE = /^[\s~♪♫▲\-]+$/;
const _HYPHEN_RE = /([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])-([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])/g;
function hexToRgba(hex, alpha) {
  const aClamped = Math.max(0, Math.min(1, alpha));
  const aInt = (aClamped * 100) | 0; // 100 niveles de precisión idénticos al ojo
  const key = `${hex}_${aInt}`;
  let cached = _rgbaCache.get(key);
  if (cached) return cached;

  let r = 255, g = 255, b = 255;
  if (typeof hex === 'string' && hex.charCodeAt(0) === 35) {
    const len = hex.length;
    if (len === 7) {
      r = parseInt(hex.substring(1, 3), 16) || 255;
      g = parseInt(hex.substring(3, 5), 16) || 255;
      b = parseInt(hex.substring(5, 7), 16) || 255;
    } else if (len === 4) {
      r = parseInt(hex[1] + hex[1], 16) || 255;
      g = parseInt(hex[2] + hex[2], 16) || 255;
      b = parseInt(hex[3] + hex[3], 16) || 255;
    }
  }
  cached = `rgba(${r}, ${g}, ${b}, ${(aInt * 0.01).toFixed(2)})`;
  if (_rgbaCache.size < 800) _rgbaCache.set(key, cached);
  return cached;
}

// Sacada fuera del bucle de notas para evitar instanciar funciones en memoria en cada frame
function tracePerspectiveQuad(ctx, x0T, x1T, x0B, x1B, topY, botY, rad) {
  const cr = Math.min(rad, (botY - topY) * 0.35, (x1T - x0T) * 0.30);
  ctx.beginPath();
  ctx.moveTo((x0T + x1T) * 0.5, topY);
  ctx.arcTo(x1T, topY, x1B, botY, cr);
  ctx.arcTo(x1B, botY, x0B, botY, cr);
  ctx.arcTo(x0B, botY, x0T, topY, cr);
  ctx.arcTo(x0T, topY, x1T, topY, cr);
  ctx.closePath();
}

// ==========================================
// MODO KARAOKE: FORMATEO Y RENDERIZADO DEFINITIVO
// ==========================================
function renderizarVersoKaraoke(verso, contenedor) {
  // 1. Obligatorio para que el navegador respete los espacios en blanco nativos
  contenedor.style.whiteSpace = 'pre-wrap';

  // 2. Mapear sílabas sin añadir espacios artificiales entre spans
  const htmlSpans = verso.map((s) => {
    let texto = s.text;
    const esMelisma = texto.trim() === '~';

    // Reemplazar guiones de sinalefa por espacios
    texto = texto.replace(/-/g, ' ');

    if (esMelisma) {
      // Se mantiene en el DOM con display:none para evitar errores de ID nulo
      return `<span id="lyric-${s.time}" class="karaoke-syllable melisma" style="display:none;" data-time="${s.time}"></span>`;
    }

    // Los spans van pegados directamente
    return `<span id="lyric-${s.time}" class="karaoke-syllable" data-time="${s.time}" data-dur="${s.dur}">${texto}</span>`;
  }).join(''); // NUNCA usar .join(' ') ni saltos de línea

  contenedor.innerHTML = htmlSpans;
}
if (typeof window !== 'undefined') window.renderizarVersoKaraoke = renderizarVersoKaraoke;

function iluminarSilaba(tiempoMs) {
  const el = document.getElementById(`lyric-${tiempoMs}`);
  if (el && !el.classList.contains('activa')) {
    el.classList.add('activa');
    // Captura el color exacto que tu CSS le aplica a la sílaba activa
    if (window.engine && !window.engine._teleprompterGold) {
      try {
        const compColor = window.getComputedStyle(el).color;
        if (compColor && compColor !== 'rgba(0, 0, 0, 0)') {
          window.engine._teleprompterGold = compColor;
        }
      } catch (_) {}
    }
  }
}

// ==========================================
// DYNAMIC SONG COLOR PALETTE REGISTRY (BEATSTAR PRESETS & ADAPTIVE SYSTEM)
// ==========================================
const SONG_COLOR_PALETTES = {
  extreme_magenta: {
    id: 'extreme_magenta',
    name: 'Extremo / Magenta Neón',
    primary: '#ff007f',
    secondary: '#d946ef',
    glow: '#ff007f',
    ribs: '#f43f5e',
    spotlight1: '#ff007f',
    spotlight2: '#a855f7',
    spark: '#ff70c5'
  },
  cyber_cyan: {
    id: 'cyber_cyan',
    name: 'Cyber / Cian Eléctrico',
    primary: '#00f2fe',
    secondary: '#00c6ff',
    glow: '#00f2fe',
    ribs: '#00f5d4',
    spotlight1: '#00f2fe',
    spotlight2: '#3b82f6',
    spark: '#a5f3fc'
  },
  fever_gold: {
    id: 'fever_gold',
    name: 'Fiebre / Oro Radiante',
    primary: '#ffd700',
    secondary: '#ffb703',
    glow: '#ffaa00',
    ribs: '#ffe082',
    spotlight1: '#ffd700',
    spotlight2: '#fb8500',
    spark: '#fff8db'
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amatista / Electrónica',
    primary: '#9b51e0',
    secondary: '#e0aaff',
    glow: '#9b51e0',
    ribs: '#c77dff',
    spotlight1: '#9b51e0',
    spotlight2: '#7b2cbf',
    spark: '#e0aaff'
  },
  fire: {
    id: 'fire',
    name: 'Fuego / Rock',
    primary: '#f2994a',
    secondary: '#eb5757',
    glow: '#f2994a',
    ribs: '#ff7a00',
    spotlight1: '#f2994a',
    spotlight2: '#d90429',
    spark: '#ffbe0b'
  },
  emerald: {
    id: 'emerald',
    name: 'Esmeralda / Chill',
    primary: '#00f5a0',
    secondary: '#6fcf97',
    glow: '#00f5a0',
    ribs: '#2ec4b6',
    spotlight1: '#00f5a0',
    spotlight2: '#06d6a0',
    spark: '#a7f3d0'
  },
  classic: {
    id: 'classic',
    name: 'Clásico / Concierto',
    primary: '#e5b869',
    secondary: '#ffffff',
    glow: '#e5b869',
    ribs: '#f3d791',
    spotlight1: '#e5b869',
    spotlight2: '#d4af37',
    spark: '#fff4d1'
  }
};

function getSongColorPalette(meta = {}) {
  if (meta.palette && SONG_COLOR_PALETTES[meta.palette]) {
    return SONG_COLOR_PALETTES[meta.palette];
  }
  if (meta.primary && meta.secondary) {
    return {
      id: meta.palette || 'custom',
      name: meta.palette || 'Personalizada',
      primary: meta.primary,
      secondary: meta.secondary,
      glow: meta.glow || meta.primary,
      ribs: meta.ribs || meta.secondary,
      spotlight1: meta.primary,
      spotlight2: meta.secondary,
      spark: meta.secondary
    };
  }

  const text = `${meta.title || ''} ${meta.artist || ''} ${meta.genre || ''} ${meta.difficulty_name || ''}`.toLowerCase();
  if (text.includes('extreme') || text.includes('extremo') || text.includes('experto') || text.includes('frenzy') || text.includes('hard') || text.includes('difícil')) {
    return SONG_COLOR_PALETTES.extreme_magenta;
  }
  if (text.includes('cyber') || text.includes('synth') || text.includes('electronic') || text.includes('electro') || text.includes('galaxy') || text.includes('neon') || text.includes('future') || text.includes('remix')) {
    return SONG_COLOR_PALETTES.cyber_cyan;
  }
  if (text.includes('fire') || text.includes('fuego') || text.includes('rock') || text.includes('metal') || text.includes('dragon') || text.includes('impuestos') || text.includes('sanxe') || text.includes('pikete')) {
    return SONG_COLOR_PALETTES.fire;
  }
  if (text.includes('chill') || text.includes('groove') || text.includes('moonlight') || text.includes('flow') || text.includes('nature') || text.includes('rain') || text.includes('breeze') || text.includes('summer') || text.includes('fácil') || text.includes('easy')) {
    return SONG_COLOR_PALETTES.emerald;
  }
  if (text.includes('piano') || text.includes('renacer') || text.includes('chopin') || text.includes('classic') || text.includes('clásic') || text.includes('mozart') || text.includes('bach') || text.includes('beethoven') || text.includes('bumblebee') || text.includes('rachmaninoff')) {
    return SONG_COLOR_PALETTES.classic;
  }

  // Fallback determinista por hash del título
  const str = (meta.title || '') + (meta.id || 'default');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  const keys = ['extreme_magenta', 'cyber_cyan', 'fever_gold', 'amethyst', 'fire', 'emerald'];
  return SONG_COLOR_PALETTES[keys[hash % keys.length]];
}

const _rgbCache = new Map();
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 229, g: 184, b: 105 };
  let cached = _rgbCache.get(hex);
  if (cached) return cached;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  cached = isNaN(num)
    ? { r: 229, g: 184, b: 105 }
    : { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  if (_rgbCache.size < 256) _rgbCache.set(hex, cached);
  return cached;
}

class HighFidelityAudioPlayer {
  constructor() {
    const savedVol = parseFloat(localStorage.getItem('beatstar_master_volume') ?? '1.0');
    const savedMuted = localStorage.getItem('beatstar_master_muted') === 'true';
    this.masterVolume = isNaN(savedVol) ? 1.0 : Math.max(0, Math.min(1, savedVol));
    this.isMuted = savedMuted;
    this.audioCtx = null;
  }

  setVolume(vol, muted = false) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.isMuted = !!muted;
  }

  ensureContext() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {}
    return this.audioCtx;
  }

  playPunchyArcadeMiss() {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
      const vol = this.isMuted ? 0 : (this.masterVolume * 0.45);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(now);
      osc.stop(now + 0.20);
    } catch (e) {}
  }

  playAnalogTapeRewind() {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.45);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  playPianoChime(scheduledTime = null, freq = 523.25) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const t = scheduledTime !== null ? scheduledTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  playClick(scheduledTime = null) {
    // Sonido de click general desactivado a petición del usuario
    return;
  }

  playMiss(scheduledTime = null) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const t = scheduledTime !== null ? scheduledTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.22);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch (_) {} };
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }
}

// ==========================================
// DIRECT HIGH-FIDELITY AUDIO SYNC ENGINE
// ==========================================

// ==========================================
// DIRECT HIGH-FIDELITY AUDIO SYNC ENGINE (120 FPS JITTER-FREE)
// ==========================================

class DirectAudioSync {
  constructor(onReady, onEnded, onError) {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    
    this.volume = 1.0;
    this.muted = false;
    this.audioElement.muted = false;
    this.audioElement.volume = 1.0;
    this._blobUrl = null;
    
    this.onReady = onReady;
    this.onEnded = onEnded;
    this.onError = onError;

    this.isPlaying = false;
    this.isLoaded = false;
    this.duration = 0;
    this.playbackRate = 1.0;
    
    // Anclaje de alta precisión con corrección de deriva suave (PLL sin saltos)
    this._anchorPerf = 0;
    this._anchorAudioMs = 0;
    this._lastSyncCheck = 0;
    this._clockSkewRate = 1.0;
    this._lastRawAudioTime = -1;

    const enforceSpeedAndPitch = () => {
      if (this.audioElement) {
        try {
          this.audioElement.defaultPlaybackRate = this.playbackRate;
          this.audioElement.playbackRate = this.playbackRate;
          this.audioElement.preservesPitch = true;
        } catch (e) {}
      }
    };

    this.audioElement.addEventListener('canplaythrough', () => {
      this.isLoaded = true;
      this.duration = this.audioElement.duration || 0;
      enforceSpeedAndPitch();
      if (this.onReady) this.onReady();
    });

    this.audioElement.addEventListener('playing', () => {
      this.isPlaying = true;
      enforceSpeedAndPitch();
      const rawSec = this.audioElement.currentTime || 0;
      this._anchorAudioMs = rawSec * 1000;
      this._anchorPerf = performance.now();
      this._lastSyncCheck = this._anchorPerf;
      this._clockSkewRate = 1.0;
      this._lastRawAudioTime = rawSec;
      const toast = document.getElementById('audioUnlockToast');
      if (toast) toast.classList.remove('show');
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this._anchorPerf = 0;
      this._clockSkewRate = 1.0;
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this._anchorPerf = 0;
      this._clockSkewRate = 1.0;
      if (this.onEnded) this.onEnded();
    });

    this.audioElement.addEventListener('error', (e) => {
      if (this.audioElement.src && this.onError) {
        this.onError('Error en la reproducción de audio.');
      }
    });
  }

  unlockAudio() {
    if (window.engine && (window.engine.isPaused || window.engine.isProcessingMiss || window.engine.isGameOver || !window.engine.isRunning)) {
      return;
    }
    if (this.audioElement) {
      this.audioElement.muted = false;
      this.audioElement.volume = 1.0;
      try {
        const p = this.audioElement.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            if (!this.isPlaying) this.audioElement.pause();
          }).catch(() => {});
        }
      } catch (e) {}
    }
  }

  showUnlockPrompt() {
    const toast = document.getElementById('audioUnlockToast');
    if (toast) toast.classList.add('show');
  }

  setPlaybackRate(rate) {
    const r = Math.max(0.5, Math.min(2.0, parseFloat(rate) || 1.0));
    this.playbackRate = r;
    if (this.audioElement) {
      try {
        this.audioElement.defaultPlaybackRate = r;
        this.audioElement.playbackRate = r;
        this.audioElement.preservesPitch = true;
      } catch (e) {}
    }
    if (this.isPlaying) {
      this._anchorAudioMs = (this.audioElement.currentTime || 0) * 1000;
      this._anchorPerf = performance.now();
    }
  }

  setVolume(vol, muted = false) {
    this.volume = isNaN(vol) ? 1.0 : Math.max(0, Math.min(1, vol));
    this.muted = !!muted;
    if (this.audioElement) {
      this.audioElement.muted = this.muted;
      this.audioElement.volume = this.muted ? 0 : this.volume;
    }
  }

  loadAudioBlob(blob) {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (!blob) return;
    if (typeof blob === 'string') {
      this.loadAudioUrl(blob);
      return;
    }
    if (this._blobUrl) {
      try { URL.revokeObjectURL(this._blobUrl); } catch (e) {}
    }
    this._blobUrl = URL.createObjectURL(blob);
    this.loadAudioUrl(this._blobUrl);
  }

  loadAudioUrl(url) {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    this.isLoaded = false;
    this.isPlaying = false;
    this.audioElement.loop = false;
    if (url) {
      this.audioElement.src = url;
      if (this.playbackRate !== 1.0) {
        this.audioElement.playbackRate = this.playbackRate;
      }
      this.audioElement.load();
    } else {
      this.audioElement.removeAttribute('src');
      this.audioElement.load();
    }
    this._anchorPerf = 0;
    this._anchorAudioMs = 0;
    this._interpolatedMs = 0;
    this._lastFrameNow = 0;
  }

  play() {
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (!this.audioElement.src) return Promise.resolve();
    if (window.engine && (window.engine.isPaused || window.engine.isProcessingMiss || window.engine.isGameOver || !window.engine.isRunning || window.engine.isCountingDown)) {
      return Promise.resolve();
    }
    try {
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.muted = this.muted;
      this.audioElement.volume = this.muted ? 0 : this.volume;

      const now = performance.now();
      const rawSec = (this.audioElement && !isNaN(this.audioElement.currentTime)) ? this.audioElement.currentTime : 0;
      if (!this.isPlaying) {
        this.isPlaying = true;
        this._interpolatedMs = Math.max(this._interpolatedMs || 0, rawSec * 1000);
        this._lastReturnedMs = this._interpolatedMs;
        this._lastFrameNow = now;
        this._lastSyncCheck = now;
        this._clockSkewRate = 1.0;
        this._smoothedDrift = 0;
        this._lastRawAudioTime = rawSec;
      }

      const p = this.audioElement.play();
      if (p && typeof p.then === 'function') {
        return p.then(() => {
          this.isPlaying = true;
        }).catch(err => {
          if (err.name === 'NotAllowedError') this.showUnlockPrompt();
        });
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  }

  pause() {
    this.isPlaying = false;
    this._anchorPerf = 0;
    this._lastFrameNow = 0;
    try {
      this.audioElement.pause();
    } catch (e) {}
  }

  seekTo(seconds) {
    const sec = Math.max(0, parseFloat(seconds) || 0);
    const ms = sec * 1000;
    this._anchorPerf = 0;
    this._anchorAudioMs = ms;
    this._interpolatedMs = ms;
    this._lastReturnedMs = ms;
    this._lastFrameNow = 0;
    this._lastRawAudioTime = -1;
    this._clockSkewRate = 1.0;
    this._smoothedDrift = 0;
    try {
      if (this.audioElement.readyState >= 1) {
        this.audioElement.currentTime = sec;
      }
    } catch (e) {}
  }

  // ==========================================
  // RELOJ PLL 100% LINEAL, MONÓTONO Y CONTINUO INTEGRADO POR DELTA VSYNC (0 TIRONES A 120 FPS)
  // ==========================================
  getCurrentTimeMs(frameNow) {
    const now = (frameNow !== undefined && frameNow !== null) ? frameNow : performance.now();

    if (!this.isPlaying) {
      if (this.audioElement && !isNaN(this.audioElement.currentTime) && this.audioElement.currentTime > 0) {
        return this.audioElement.currentTime * 1000;
      }
      if (window.engine && window.engine.isRunning && !window.engine.isPaused && !window.engine.isCountingDown) {
        if (!this._fallbackAnchor) this._fallbackAnchor = now;
        return (now - this._fallbackAnchor) * (this.playbackRate || 1.0);
      }
      return this._interpolatedMs || this._anchorAudioMs || 0;
    }

    // Si ya se calculó para este mismo VSync frameNow, devolver en O(1)
    if (frameNow !== undefined && frameNow !== null && this._cachedFrameNow === frameNow) {
      return this._lastReturnedMs;
    }

    this._fallbackAnchor = null;
    const rate = this.playbackRate || 1.0;

    if (!this._lastFrameNow) {
      const rawSec = (this.audioElement && !isNaN(this.audioElement.currentTime)) ? this.audioElement.currentTime : 0;
      this._lastFrameNow = now;
      this._interpolatedMs = Math.max(this._interpolatedMs || 0, rawSec * 1000);
      this._lastReturnedMs = this._interpolatedMs;
      this._lastSyncCheck = now;
      this._clockSkewRate = 1.0;
      this._smoothedDrift = 0;
      this._lastRawAudioTime = rawSec;
      this._cachedFrameNow = frameNow;
      return this._interpolatedMs;
    }

    // Avance puro por delta de frame VSync (garantiza que la velocidad nunca salte hacia atrás ni se congele)
    const rawDtMs = now - this._lastFrameNow;
    const dtMs = rawDtMs > 0 ? Math.min(50.0, rawDtMs) : 0;
    this._lastFrameNow = now;

    this._interpolatedMs += dtMs * rate * (this._clockSkewRate || 1.0);

    // Muestrear deriva cada 250ms filtrando el escalón de cuantización del buffer de audio (21-46ms en Android)
    if (now - this._lastSyncCheck >= 250) {
      this._lastSyncCheck = now;
      const rawSec = this.audioElement ? this.audioElement.currentTime : 0;
      if (rawSec !== this._lastRawAudioTime && rawSec > 0) {
        this._lastRawAudioTime = rawSec;
        const hwAudioMs = rawSec * 1000;
        const drift = hwAudioMs - this._interpolatedMs;

        if (Math.abs(drift) > 950) {
          this._interpolatedMs = hwAudioMs;
          this._lastReturnedMs = hwAudioMs;
          this._clockSkewRate = 1.0;
          this._smoothedDrift = 0;
        } else {
          // Filtro paso-bajo exponencial que absorbe el jitter de cuantización del mixer de audio sin dar tirones visuales
          this._smoothedDrift = (this._smoothedDrift || 0) * 0.82 + drift * 0.18;
          if (Math.abs(this._smoothedDrift) > 18.0) {
            // Corrección de frecuencia progresiva y suave (±0.75% máx) 100% libre de saltos de posición
            this._clockSkewRate = 1.0 + Math.max(-0.0075, Math.min(0.0075, this._smoothedDrift / 2600));
          } else {
            this._clockSkewRate = 1.0;
          }
        }
      }
    }

    this._lastReturnedMs = this._interpolatedMs;
    this._anchorAudioMs = this._interpolatedMs;
    this._cachedFrameNow = frameNow;
    return this._interpolatedMs;
  }
}


// ==========================================
// HIGH PERFORMANCE ZERO-GC PARTICLE POOL SYSTEM
// ==========================================

class ParticleSystem {
  constructor(maxParticles = 72, maxShockwaves = 12) {
    this.maxParticles = maxParticles;
    this.maxShockwaves = maxShockwaves;
    this.maxArcs = 12;

    // Fixed pre-allocated memory pool (Zero Garbage Collection spikes)
    this.particles = new Array(maxParticles);
    for (let i = 0; i < maxParticles; i++) {
      this.particles[i] = {
        active: false,
        x: 0, y: 0,
        vx: 0, vy: 0,
        gravity: 0,
        drag: 1.0,
        radius: 0,
        color: '#ffffff',
        alpha: 1.0,
        decay: 1.0,
        type: 'spark',
        rotation: 0,
        rotSpeed: 0,
        scaleX: 1,
        scaleY: 1
      };
    }

    this.shockwaves = new Array(maxShockwaves);
    for (let i = 0; i < maxShockwaves; i++) {
      this.shockwaves[i] = {
        active: false,
        x: 0, y: 0,
        radius: 0,
        maxRadius: 0,
        growth: 0,
        color: '#ffffff',
        alpha: 1.0,
        decay: 1.0,
        lineWidth: 2.0
      };
    }

    this.lightningArcs = new Array(this.maxArcs);
    for (let i = 0; i < this.maxArcs; i++) {
      this.lightningArcs[i] = {
        active: false,
        points: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
        color: '#00f2fe',
        alpha: 1.0,
        decay: 4.5,
        lineWidth: 3.0
      };
    }
  }

  reset() {
    if (this.particles) {
      for (let i = 0; i < this.maxParticles; i++) {
        if (this.particles[i]) this.particles[i].active = false;
      }
    }
    if (this.shockwaves) {
      for (let i = 0; i < this.maxShockwaves; i++) {
        if (this.shockwaves[i]) this.shockwaves[i].active = false;
      }
    }
    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        if (this.lightningArcs[i]) this.lightningArcs[i].active = false;
      }
    }
  }

  spawnParticle() {
    for (let i = 0; i < this.maxParticles; i++) {
      if (!this.particles[i].active) {
        this.particles[i].active = true;
        return this.particles[i];
      }
    }
    return null;
  }

  spawnShockwave() {
    for (let i = 0; i < this.maxShockwaves; i++) {
      if (!this.shockwaves[i].active) {
        this.shockwaves[i].active = true;
        return this.shockwaves[i];
      }
    }
    return null;
  }

  // 1. Acoustic Grand Piano Warm Golden Flash & Radiant Sparks
  emitHit(x, y, color = '#ffdf9e', count = 8) {
    const goldPalette = ['#ffdf9e', '#ffd700', '#fff4d1', '#f5cb6c', '#ffffff', '#00f5a0'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 25;
      p.gravity = 40;
      p.drag = 0.95;
      p.radius = 1.8 + Math.random() * 3.0;
      p.color = (color === '#00f2fe' || !color) ? goldPalette[Math.floor(Math.random() * goldPalette.length)] : color;
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.5;
      p.type = Math.random() < 0.4 ? 'glitter_star' : 'spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 8;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 70;
      sw.growth = 15.0;
      sw.color = (color === '#00f2fe' || !color) ? '#ffdf9e' : color;
      sw.alpha = 0.95;
      sw.decay = 3.6;
      sw.lineWidth = 2.5;
    }
  }

  // Lluvia de brillantitos continuos y diamantes estelares en Holds
  emitHoldSparks(x, y, color = '#ffe082', count = 6) {
    const glitterPal = [color, '#ffffff', '#fff7d6', '#ffd700', '#00f5a0', '#00f2fe', '#ff00aa'];
    const safeCount = Math.min(count, 8);
    for (let i = 0; i < safeCount; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const speed = 70 + Math.random() * 240;

      p.x = x + (Math.random() - 0.5) * 28;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 35;
      p.gravity = 110;
      p.drag = 0.94;
      p.radius = 2.2 + Math.random() * 3.2;
      p.color = glitterPal[Math.floor(Math.random() * glitterPal.length)];
      p.alpha = 1.0;
      p.decay = 2.8 + Math.random() * 1.8;
      p.type = Math.random() < 0.65 ? 'glitter_star' : (Math.random() < 0.5 ? 'diamond_spark' : 'spark');
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 12;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    if (Math.random() < 0.60) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 6;
        sw.maxRadius = 45;
        sw.growth = 26.0;
        sw.color = color;
        sw.alpha = 0.85;
        sw.decay = 4.2;
        sw.lineWidth = 2.0;
      }
    }

    // Micro-onda expansiva de choque de contacto en el receptor
    if (Math.random() < 0.45) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 4;
        sw.maxRadius = 38;
        sw.growth = 24.0;
        sw.color = color;
        sw.alpha = 0.90;
        sw.decay = 5.5;
        sw.lineWidth = 2.0;
      }
    }
  }

  emitHoldSpark(x, y, color = '#ffe082') {
    this.emitHoldSparks(x, y, color, 3);
  }

  // Celebración de Estrella Desbloqueada: Shockwave circular + 8 chispas en caída parabólica aditiva
  emitStarCelebration(x, y, isPlatinum = false) {
    const pal = isPlatinum 
      ? ['#ffffff', '#a5f3fc', '#e0f2fe', '#ffffff', '#38bdf8'] 
      : ['#fff0c2', '#e5b869', '#ffd700', '#f3d791', '#ffffff'];
    
    // 8 chispas aditivas con trayectoria parabólica descendente
    for (let i = 0; i < 8; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.PI * 0.15) + (Math.random() * Math.PI * 0.7); // Dispersión angular lateral/inferior
      const speed = 75 + Math.random() * 115;
      p.x = x + (Math.random() - 0.5) * 14;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 20;
      p.gravity = 220; // Caída parabólica pronunciada hacia abajo
      p.drag = 0.95;
      p.radius = 2.2 + Math.random() * 1.8;
      p.color = pal[Math.floor(Math.random() * pal.length)];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 0.8;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    // Micro-onda expansiva (shockwave) circular desde el nodo de la estrella
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 6;
      sw.maxRadius = 45;
      sw.growth = 16.0;
      sw.color = isPlatinum ? '#ffffff' : '#e5b869';
      sw.alpha = 1.0;
      sw.decay = 4.2;
      sw.lineWidth = 2.5;
    }
  }

  // 2. EFECTO 1: CHORROS DE PINTURA NEÓN (SPLASH / SPLATTER)
  emitPaintSplash(x, y, count = 30) {
    const paintPalette = [
      '#ff007f', // Vivid Magenta
      '#00f2fe', // Electric Cyan
      '#ffe600', // Neon Yellow
      '#39ff14', // Acid Lime
      '#b142ff', // Purple Neon
      '#ff3366'  // Coral Splat
    ];

    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = (Math.random() - 0.5) * Math.PI * 1.6 - Math.PI / 2; // Upward-biased radial fan
      const speed = 80 + Math.random() * 220;
      const col = paintPalette[Math.floor(Math.random() * paintPalette.length)];

      p.x = x + (Math.random() - 0.5) * 16;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 240; // Quick downward fall
      p.drag = 0.93;    // Liquid air resistance
      p.radius = 2.5 + Math.random() * 4.5;
      p.color = col;
      p.alpha = 1.0;
      p.decay = 2.8 + Math.random() * 1.2; // Quick fade (300-380ms)
      p.type = 'paint_drop';
      p.rotation = angle + Math.PI / 2;
      p.rotSpeed = (Math.random() - 0.5) * 4.0;
      p.scaleX = 0.85 + Math.random() * 0.4;
      p.scaleY = 1.2 + Math.random() * 0.8; // Elongated paint splatter tear
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 75;
      sw.growth = 14.0;
      sw.color = paintPalette[Math.floor(Math.random() * paintPalette.length)];
      sw.alpha = 0.95;
      sw.decay = 3.6;
      sw.lineWidth = 3.0;
    }
  }

  // 3. EFECTO 2: MODO FUEGO / INFIERNO (FIRE EFFECT)
  emitFireInferno(x, y, count = 32) {
    const fireColors = ['#ffffff', '#ffea00', '#ff8800', '#ff3300', '#ff0033'];

    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1; // Rising flame column
      const speed = 90 + Math.random() * 240;
      const col = fireColors[Math.floor(Math.random() * fireColors.length)];

      p.x = x + (Math.random() - 0.5) * 22;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 60; // Powerful upward lift
      p.gravity = -80; // Anti-gravity buoyancy for fire embers
      p.drag = 0.94;
      p.radius = 3.0 + Math.random() * 5.0;
      p.color = col;
      p.alpha = 0.95;
      p.decay = 2.6 + Math.random() * 1.4;
      p.type = 'fire_ember';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 6.0;
      p.scaleX = 1;
      p.scaleY = 1.3;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 80;
      sw.growth = 13.0;
      sw.color = '#ff6600';
      sw.alpha = 0.9;
      sw.decay = 3.8;
      sw.lineWidth = 2.5;
    }
  }

  spawnLightningArc(startX, startY, endX, endY, color = '#00f2fe') {
    if (!this.lightningArcs) return null;
    for (let i = 0; i < this.maxArcs; i++) {
      const arc = this.lightningArcs[i];
      if (!arc.active) {
        arc.active = true;
        arc.color = color;
        arc.alpha = 0.95;
        arc.decay = 5.0; // Quick snappy lightning flash
        arc.lineWidth = 2.5 + Math.random() * 2.0;

        const numPts = arc.points.length;
        arc.points[0].x = startX;
        arc.points[0].y = startY;
        arc.points[numPts - 1].x = endX;
        arc.points[numPts - 1].y = endY;

        const dx = (endX - startX) / (numPts - 1);
        const dy = (endY - startY) / (numPts - 1);
        const normalX = -dy;
        const normalY = dx;
        const len = Math.hypot(normalX, normalY) || 1;

        for (let j = 1; j < numPts - 1; j++) {
          const jitter = (Math.random() - 0.5) * 50;
          arc.points[j].x = startX + dx * j + (normalX / len) * jitter;
          arc.points[j].y = startY + dy * j + (normalY / len) * jitter;
        }
        return arc;
      }
    }
    return null;
  }

  // 4. FULL FOCUS: FUEGOS ARTIFICIALES (Múltiples salvas a pantalla completa con física de gravedad)
  emitFullFocusFireworks(x, y, color = '#00f2fe', width = 360, height = 740) {
    const burstPositions = [
      { x: x, y: y, count: 28, speed: 260 },
      { x: width * 0.22, y: height * 0.22, count: 22, speed: 230 },
      { x: width * 0.78, y: height * 0.26, count: 22, speed: 230 },
      { x: width * 0.50, y: height * 0.45, count: 24, speed: 240 }
    ];

    for (let bIdx = 0; bIdx < burstPositions.length; bIdx++) {
      const b = burstPositions[bIdx];
      for (let i = 0; i < b.count; i++) {
        const p = this.spawnParticle();
        if (!p) break;

        const angle = Math.random() * Math.PI * 2;
        const speed = 75 + Math.random() * b.speed;

        p.x = b.x;
        p.y = b.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 50;
        p.gravity = 320; // Gravitational descent
        p.drag = 0.94;
        p.radius = 2.2 + Math.random() * 3.5;
        p.color = color;
        p.alpha = 1.0;
        p.decay = 2.2 + Math.random() * 1.2;
        p.type = 'spark';
        p.rotation = 0;
        p.rotSpeed = 0;
        p.scaleX = 1;
        p.scaleY = 1;
      }

      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = b.x;
        sw.y = b.y;
        sw.radius = 6;
        sw.maxRadius = 75;
        sw.growth = 16.0;
        sw.color = color;
        sw.alpha = 0.9;
        sw.decay = 4.0;
        sw.lineWidth = 2.5;
      }
    }
  }

  // 5. FULL FOCUS: AROS ELÉCTRICOS (Ondas de choque gigantes a pantalla completa y arcos eléctricos)
  emitFullFocusElectric(x, y, color = '#00f2fe', width = 360, height = 740) {
    const maxScreen = Math.max(width, height) * 1.35;

    // 1. Aros eléctricos gigantes concéntricos que superan los bordes de la pantalla
    for (let i = 0; i < 3; i++) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = (i === 0) ? x : width / 2;
        sw.y = (i === 0) ? y : height * 0.55;
        sw.radius = 8 + i * 20;
        sw.maxRadius = maxScreen;
        sw.growth = 38.0 + i * 10;
        sw.color = color;
        sw.alpha = 0.95;
        sw.decay = 3.6;
        sw.lineWidth = 4.0 - i * 0.8;
      }
    }

    // 2. Arcos eléctricos ramificados a lo largo de toda la pantalla
    this.spawnLightningArc(0, height * 0.20, width, height * 0.85, color);
    this.spawnLightningArc(width, height * 0.15, 0, height * 0.80, color);
    this.spawnLightningArc(width * 0.15, 0, x, y, color);
    this.spawnLightningArc(width * 0.85, 0, x, y, color);

    // 3. Chispas de impacto de alta energía
    for (let i = 0; i < 18; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (i / 18) * Math.PI * 2;
      const speed = 140 + Math.random() * 220;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.91;
      p.radius = 2.0 + Math.random() * 2.5;
      p.color = '#ffffff';
      p.alpha = 1.0;
      p.decay = 3.5;
      p.type = 'spark';
      p.rotation = 0;
      p.rotSpeed = 0;
      p.scaleX = 1;
      p.scaleY = 1;
    }
  }

  emitBurst(x, y, color = '#ffe082', count = 20) {
    this.emitHit(x, y, color, Math.min(count, 18));
  }

  emitSwipeBurst(x, y, direction = 'up', color = '#ffd700', count = 36) {
    const swipePalette = [color, '#ffffff', '#fff7d6', '#00f2fe', '#ffd700'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;

      let baseAngle = -Math.PI / 2;
      if (direction === 'down') baseAngle = Math.PI / 2;
      else if (direction === 'left') baseAngle = Math.PI;
      else if (direction === 'right') baseAngle = 0;

      const angle = baseAngle + (Math.random() - 0.5) * 0.9;
      const speed = 220 + Math.random() * 480; // Hipersónico

      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + (Math.random() - 0.5) * 10;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 0;
      p.drag = 0.95;
      p.radius = 2.4 + Math.random() * 3.8;
      p.color = swipePalette[Math.floor(Math.random() * swipePalette.length)];
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.8;
      p.type = Math.random() < 0.55 ? 'glitter_star' : (Math.random() < 0.4 ? 'diamond_spark' : 'spark');
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 16;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 12;
      sw.maxRadius = 95;
      sw.growth = 22.0;
      sw.color = color;
      sw.alpha = 1.0;
      sw.decay = 3.8;
      sw.lineWidth = 3.2;
    }
  }

  // 1. EXCLUSIVO 3D: CHISPAS DE LATÓN REAL (Royal Brass Sparks & Embers)
  emitRoyalBrass(x, y, count = 28) {
    const brassPalette = ['#fff3cf', '#ffd700', '#c5a059', '#e6af34', '#ffffff', '#f59e0b'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.random() - 0.5) * Math.PI * 1.5 - Math.PI / 2;
      const speed = 90 + Math.random() * 240;
      p.x = x + (Math.random() - 0.5) * 12;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 180;
      p.drag = 0.94;
      p.radius = 1.8 + Math.random() * 3.2;
      p.color = brassPalette[Math.floor(Math.random() * brassPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.4 + Math.random() * 1.6;
      p.type = 'spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 12;
      p.scaleX = 1;
      p.scaleY = 1;
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 75;
      sw.growth = 16.0;
      sw.color = '#ffd700';
      sw.alpha = 1.0;
      sw.decay = 3.5;
      sw.lineWidth = 3.2;
    }
  }

  // 2. EXCLUSIVO 3D: RESONANCIA ARMÓNICA (Acoustic Standing Waves)
  emitAcousticResonance(x, y) {
    const sw1 = this.spawnShockwave();
    if (sw1) {
      sw1.x = x;
      sw1.y = y;
      sw1.radius = 6;
      sw1.maxRadius = 90;
      sw1.growth = 18.0;
      sw1.color = '#ffe082';
      sw1.alpha = 1.0;
      sw1.decay = 3.2;
      sw1.lineWidth = 3.5;
    }
    const sw2 = this.spawnShockwave();
    if (sw2) {
      sw2.x = x;
      sw2.y = y;
      sw2.radius = 2;
      sw2.maxRadius = 130;
      sw2.growth = 12.0;
      sw2.color = '#c5a059';
      sw2.alpha = 0.8;
      sw2.decay = 2.0;
      sw2.lineWidth = 2.0;
    }
    const goldTones = ['#fff8db', '#f3d791', '#d4af37', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 110;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 15;
      p.gravity = -20;
      p.drag = 0.96;
      p.radius = 1.4 + Math.random() * 2.2;
      p.color = goldTones[Math.floor(Math.random() * goldTones.length)];
      p.alpha = 0.95;
      p.decay = 1.8 + Math.random() * 1.2;
      p.type = 'spark';
    }
  }

  // 3. EXCLUSIVO 3D: FUEGO CARMESÍ & TERCIOPELO (Crimson Damper Royale)
  emitCrimsonRoyale(x, y, count = 26) {
    const crimsonPalette = ['#85141d', '#b91c1c', '#dc2626', '#ffd700', '#fff3cf', '#f87171'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (Math.random() - 0.5) * Math.PI * 1.6 - Math.PI / 2;
      const speed = 70 + Math.random() * 180;
      p.x = x + (Math.random() - 0.5) * 14;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 60;
      p.drag = 0.95;
      p.radius = 2.0 + Math.random() * 3.5;
      p.color = crimsonPalette[Math.floor(Math.random() * crimsonPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 1.4;
      p.type = 'spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 8;
      sw.maxRadius = 80;
      sw.growth = 15.0;
      sw.color = '#e11d48';
      sw.alpha = 0.9;
      sw.decay = 3.0;
      sw.lineWidth = 3.0;
    }
  }

  // 4. EXCLUSIVO 3D: MARFIL CENITAL (Luminous Zenith Ivory)
  emitLuminousIvory(x, y, count = 25) {
    const ivoryPalette = ['#ffffff', '#fdfbf7', '#fff8e7', '#fef3c7', '#ffd700', '#f5e6d3'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 20;
      p.gravity = 25;
      p.drag = 0.94;
      p.radius = 2.0 + Math.random() * 3.0;
      p.color = ivoryPalette[Math.floor(Math.random() * ivoryPalette.length)];
      p.alpha = 1.0;
      p.decay = 2.2 + Math.random() * 1.5;
      p.type = 'spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 12;
      sw.maxRadius = 85;
      sw.growth = 17.0;
      sw.color = '#ffffff';
      sw.alpha = 1.0;
      sw.decay = 3.8;
      sw.lineWidth = 3.5;
    }
  }

  // 5. GACHAPON COLECCIONISTA: SINFONÍA ESMERALDA IMPERIAL
  emitEmeraldSymphony(x, y, count = 28) {
    const emeraldPalette = ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#ecfdf5', '#059669'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 75 + Math.random() * 210;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 35;
      p.gravity = 30;
      p.drag = 0.94;
      p.radius = 2.2 + Math.random() * 3.2;
      p.color = emeraldPalette[i % emeraldPalette.length];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 1.3;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 10;
      p.type = i % 2 === 0 ? 'diamond_spark' : 'glitter_star';
    }
    for (let r = 0; r < 2; r++) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 8 + r * 10;
        sw.maxRadius = 75 + r * 22;
        sw.growth = 15.0 + r * 3;
        sw.color = r === 0 ? '#34d399' : '#fbbf24';
        sw.alpha = 0.95;
        sw.decay = 3.2;
        sw.lineWidth = 3.0 - r * 0.8;
      }
    }
  }

  // 6. GACHAPON ÉPICO: VÓRTICE DE AMATISTA VINTAGE
  emitAmethystVortex(x, y, count = 30) {
    const amethystPalette = ['#c084fc', '#a855f7', '#e879f9', '#f5d0fe', '#fbbf24', '#f43f5e'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const spiralAngle = (i / count) * Math.PI * 4;
      const speed = 65 + (i / count) * 195;
      p.x = x + Math.cos(spiralAngle) * 6;
      p.y = y + Math.sin(spiralAngle) * 4;
      p.vx = Math.cos(spiralAngle) * speed;
      p.vy = Math.sin(spiralAngle) * speed - 25;
      p.gravity = 20;
      p.drag = 0.95;
      p.radius = 2.0 + Math.random() * 3.4;
      p.color = amethystPalette[i % amethystPalette.length];
      p.alpha = 1.0;
      p.decay = 1.9 + Math.random() * 1.4;
      p.rotation = spiralAngle;
      p.rotSpeed = 12;
      p.type = i % 3 === 0 ? 'glitter_star' : 'diamond_spark';
    }
    const sw = this.spawnShockwave();
    if (sw) {
      sw.x = x;
      sw.y = y;
      sw.radius = 10;
      sw.maxRadius = 92;
      sw.growth = 16.5;
      sw.color = '#e879f9';
      sw.alpha = 0.95;
      sw.decay = 3.4;
      sw.lineWidth = 3.2;
    }
  }

  // 7. GACHAPON LEGENDARIO: SUPERNOVA DE DIAMANTE CELESTIAL
  emitDiamondSupernova(x, y, count = 36) {
    const diamondPalette = ['#ffffff', '#38bdf8', '#bae6fd', '#fde047', '#f472b6', '#7dd3fc'];
    for (let i = 0; i < count; i++) {
      const p = this.spawnParticle();
      if (!p) break;
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const speed = 90 + Math.random() * 240;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 40;
      p.gravity = 18;
      p.drag = 0.94;
      p.radius = 2.4 + Math.random() * 3.8;
      p.color = diamondPalette[i % diamondPalette.length];
      p.alpha = 1.0;
      p.decay = 1.85 + Math.random() * 1.3;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 14;
      p.type = i % 2 === 0 ? 'glitter_star' : 'diamond_spark';
    }
    for (let r = 0; r < 2; r++) {
      const sw = this.spawnShockwave();
      if (sw) {
        sw.x = x;
        sw.y = y;
        sw.radius = 10 + r * 14;
        sw.maxRadius = 95 + r * 25;
        sw.growth = 18.0;
        sw.color = r === 0 ? '#ffffff' : '#38bdf8';
        sw.alpha = 1.0;
        sw.decay = 3.5;
        sw.lineWidth = 3.6 - r * 1.0;
      }
    }
  }

  update(dt) {
    if (!this.particles || !this.shockwaves) return;
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p || !p.active) continue;

      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy = (p.vy + p.gravity * dt) * Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotSpeed) {
        p.rotation += p.rotSpeed * dt;
      }

      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        p.active = false;
      }
    }

    for (let i = 0; i < this.maxShockwaves; i++) {
      const s = this.shockwaves[i];
      if (!s || !s.active) continue;

      s.radius += (s.maxRadius - s.radius) * s.growth * dt;
      s.alpha -= s.decay * dt;
      if (s.alpha <= 0) {
        s.active = false;
      }
    }

    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        const a = this.lightningArcs[i];
        if (!a || !a.active) continue;
        a.alpha -= a.decay * dt;
        if (a.alpha <= 0) a.active = false;
      }
    }
  }

  render(ctx) {
    if (!this.particles || !this.shockwaves || !ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p || !p.active || p.alpha <= 0.01) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'glitter_star') {
        // Estrella diamante ✦ de 4 puntas ultra-brillante
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const rOuter = Math.max(2.0, p.radius * 2.2);
        const rInner = rOuter * 0.22;
        ctx.beginPath();
        for (let pt = 0; pt < 8; pt++) {
          const rCur = (pt % 2 === 0) ? rOuter : rInner;
          const aCur = (pt / 8) * Math.PI * 2;
          const px = Math.cos(aCur) * rCur;
          const py = Math.sin(aCur) * rCur;
          if (pt === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();

        // Núcleo blanco diamantino
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, rInner * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'diamond_spark') {
        // Micro-diamante facetado ◆
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const dW = p.radius * 1.6;
        const dH = p.radius * 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -dH);
        ctx.lineTo(dW, 0);
        ctx.lineTo(0, dH);
        ctx.lineTo(-dW, 0);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'paint_drop') {
        // Render stylized tear/droplet of paint
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scaleX, p.scaleY);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'fire_ember') {
        const r = p.radius * (0.6 + p.alpha * 0.4);
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      } else {
        const r = p.radius;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
    }

    for (let i = 0; i < this.maxShockwaves; i++) {
      const s = this.shockwaves[i];
      if (!s.active || s.alpha <= 0.01) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth || 2.0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.lightningArcs) {
      for (let i = 0; i < this.maxArcs; i++) {
        const a = this.lightningArcs[i];
        if (!a || !a.active || a.alpha <= 0.01) continue;

        ctx.globalAlpha = Math.max(0, Math.min(1, a.alpha));
        ctx.strokeStyle = a.color;
        ctx.lineWidth = a.lineWidth || 2.5;
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let j = 1; j < a.points.length; j++) {
          ctx.lineTo(a.points[j].x, a.points[j].y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, (a.lineWidth || 2.5) * 0.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ==========================================
// 3-LANE FIXED BEATSTAR ENGINE
// ==========================================

const GLOBAL_SYNTH_PALETTES = [
  ['#7c3aed', '#8b5cf6', '#3b82f6', '#00f2fe', '#10b981', '#39ff14', '#ff007f', '#ff2040'],
  ['#4c1d95', '#c026d3', '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '#fde047', '#ffffff'],
  ['#1e3a8a', '#0284c7', '#06b6d4', '#10b981', '#34d399', '#39ff14', '#a3e635', '#fef08a'],
  ['#312e81', '#6366f1', '#818cf8', '#38bdf8', '#2dd4bf', '#f472b6', '#fb7185', '#fed7aa'],
  ['#881337', '#be123c', '#e11d48', '#f97316', '#f59e0b', '#facc15', '#fef08a', '#ffffff']
];

const GLOBAL_BEAM_PALETTE = [
  { r: 0,   g: 242, b: 254 }, // Cian Neón
  { r: 255, g: 0,   b: 127 }, // Magenta Metálico
  { r: 251, g: 191, b: 36  }, // Oro Radiante
  { r: 168, g: 85,  b: 247 }, // Violeta Eléctrico
  { r: 57,  g: 255, b: 20  }, // Lima Flúor
  { r: 56,  g: 189, b: 248 }  // Azul Turquesa
];

const GLOBAL_DISCO_SPOTLIGHTS = [
  { x: -0.65, y: -0.55, z: 0.52, rgb: { r: 255, g: 255, b: 255 }, weight: 1.1 },
  { x: 0.70, y: -0.45, z: 0.55, rgb: { r: 0, g: 242, b: 254 }, weight: 0.95 },
  { x: -0.25, y: -0.75, z: 0.60, rgb: { r: 255, g: 0, b: 127 }, weight: 1.0 },
  { x: 0.40, y: -0.60, z: 0.70, rgb: { r: 251, g: 191, b: 36 }, weight: 0.9 }
];

class BeatstarEngine {
  constructor(canvas, uiCallbacks) {
    this.canvas = canvas;
    this.ctx = (canvas && canvas.getContext)
      ? canvas.getContext('2d')
      : null;
    this.ui = uiCallbacks;

    // Buffers reutilizables Zero-GC para coordenadas en perspectiva a 120 FPS
    this._coordScratch0 = { x: 0, y: 0, scale: 1, laneW: 50, pCurved: 0 };
    this._coordScratch1 = { x: 0, y: 0, scale: 1, laneW: 50, pCurved: 0 };
    this._coordScratch2 = { x: 0, y: 0, scale: 1, laneW: 50, pCurved: 0 };
    this._frameDt = 1 / 120;
    this._lastPortalPulse = -1;
    this._canvasRect = null;

    // Cap resolution scaling for 120 FPS mobile GPU efficiency
    this.dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 1.5);
    this.width = 0;
    this.height = 0;
    this.numLanes = 3; // Fixed strictly to 3 vertical lanes
    this.laneWidth = 0;
    this.hitLineY = 0;
    this.baseScrollDurationMs = 1200;
    this.noteSpeedMultiplier = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_note_speed') || '1.0') : '1.0') || 1.0;
    this.songPlaybackRate = 1.0;
    this.scrollDurationMs = Math.round(this.baseScrollDurationMs / Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier)));

    this.notes = [];
    this.activeHolds = new Map();
    this.activeTouches = new Map();
    this.laneGlows = [0, 0, 0, 0];
    this.fxRipples = [];
    this.bgBursts = [];
    this.musicalNotes = [];
    this.topComboToast = null;
    this.combo3DExplosions = [];
    this.activeAtmosphereColor = null;
    this.targetAtmosphereColor = null;
    this.atmosphereShiftProgress = 1.0;
    this.speedStreaks = [];

    // Key FX Theme (default_neon, color_burst, spotlight_reveal)
    this.activeEffect = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_active_effect') : null) || 'default_neon';
    this.latencyOffsetMs = parseInt(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_offset') || '0') : '0', 10) || 0;

    // Custom Background & Reactive Illumination System
    this.customBgMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_bg_mode') : null) || 'black';
    this.customBgOpacity = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_opacity') || '0.40') : '0.40') || 0.40;
    this.customBgCropX = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_x') || '0.5') : '0.5');
    this.customBgCropY = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_y') || '0.5') : '0.5');
    this.customBgZoom = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_crop_zoom') || '1.0') : '1.0');
    this.customBgFit = (typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_bg_fit') || 'cover') : 'cover');
    this.customBgMedia = null;
    this.customBgMediaType = null; // 'image' or 'video'
    this.customBgVideo = null;
    this.reactiveLightBoost = 0;
    this.lastHitColor = '#00f2fe';
    this.spotlightCanvas = null;
    this.spotlightCtx = null;
    this.activeSwipeDrags = new Map();
    this.hudArtistPortalEl = null;

    // Bola de Discoteca Ultra-Optimizada (120 FPS, 0 Lag, Luces de Colores Glow)
    this.discoBall = {
      active: false,
      descendY: -120,
      targetY: -120,
      radius: 27,
      rotation: 0,
      rotSpeed: 0.85,
      latBands: 7,
      lonSegments: 14,
      specks: []
    };
    for (let i = 0; i < 14; i++) {
      this.discoBall.specks.push({
        theta: Math.random() * Math.PI * 2,
        phi: (Math.random() - 0.5) * Math.PI * 0.88,
        dist: 0.15 + Math.random() * 0.80,
        size: 4.0 + Math.random() * 5.0,
        speed: 0.35 + Math.random() * 0.85,
        colorIdx: i % 6,
        brightness: 0.60 + Math.random() * 0.40,
        shimmerPhase: Math.random() * Math.PI * 2,
        shimmerSpeed: 3.0 + Math.random() * 5.0
      });
    }

    // PC Controls & Detection
    this.isPCMode = (typeof window !== 'undefined') && (!('ontouchstart' in window) && (navigator.maxTouchPoints === 0 || (window.matchMedia && window.matchMedia('(pointer: fine)').matches)));
    const savedKeybinds = (typeof localStorage !== 'undefined') ? localStorage.getItem('beatstar_pc_keybinds') : null;
    this.pcKeybinds = savedKeybinds ? JSON.parse(savedKeybinds) : { 0: 'd', 1: 'f', 2: 'j' };
    this.initCustomBackground();

    // Scoring & Multiplier
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.lastCelebratedStar = 0;
    this.targetScore = 100000;
    this.missCount = 0;
    this.invulnerableUntil = 0;
    this.isRunning = false;
    this.isPaused = true;
    this.isInitialLaunch = true;
    this.isRewinding = false;
    this.isCountingDown = false;
    const savedContinueMode = typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_continue_mode') : null;
    this.continueMode = (savedContinueMode === 'true' || savedContinueMode === true);
    this.judgements = [];
    this.flyingLyrics = [];
    this.activeKaraokeLyrics = [];
    this._lastCurLyricIndex = -1;
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    this.timingStats = { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
    this.overdriveLevel = 0;
    this.overdriveFlash = 0;
    this._wasOverdrive = false;
    this.vignetteAlpha = 0;
    this.vignetteColor = '#e5b869';

    // Master Volume & Mute
    const savedMasterVol = parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('beatstar_master_volume') ?? '1.0') : '1.0');
    const savedMasterMuted = typeof localStorage !== 'undefined' && localStorage.getItem('beatstar_master_muted') === 'true';
    this.masterVolume = isNaN(savedMasterVol) ? 1.0 : Math.max(0, Math.min(1, savedMasterVol));
    this.masterMuted = savedMasterMuted;

    // Custom judgment colors: Paleta vibrante Beatstar para juicios y resplandor de carril
    const _savedJudgeColors = (() => { try { return JSON.parse(localStorage.getItem('beatstar_judge_colors') || 'null'); } catch(e) { return null; } })();
    if (_savedJudgeColors && _savedJudgeColors.perfectPlus === '#ffffff' && _savedJudgeColors.perfect === '#e5b869') {
      delete _savedJudgeColors.perfectPlus;
      delete _savedJudgeColors.perfect;
      delete _savedJudgeColors.great;
      delete _savedJudgeColors.good;
    }
    this.judgeColors = Object.assign({
      perfectPlus: '#00f5a0',
      perfect:     '#ffd700',
      great:       '#00d4ff',
      good:        '#ff7b00'
    }, _savedJudgeColors || {});

    this.visualDimension = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) || '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';

    this.nextCalibNoteTime = 0;
    this.synth = new HighFidelityAudioPlayer();

    this.particles = new ParticleSystem();
    this.sync = new DirectAudioSync(
      () => this.onAudioReady(),
      () => this.onAudioEnded(),
      (msg) => this.onAudioError(msg)
    );
    this.audioSync = this.sync;

    this.lanePressAnim = [0, 0, 0, 0];
    this.laneFlashTimers = [0, 0, 0, 0];
    this.laneFlashColors = ['#00f5a0', '#00f5a0', '#00f5a0', '#00f5a0'];
    this.lastHitTimePerf = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this._holdPointsBuffer = Array.from({ length: 16 }, () => ({ x: 0, y: 0, scale: 1, laneW: 50, halfW: 20 }));

    this.initCanvasSize();
    this.bindEvents();

    // Cache de elementos de odómetro (roller digits)
    this.cachedRollerDigits = [0, 1, 2, 3, 4, 5, 6].map(d => (typeof document !== 'undefined' ? document.getElementById(`rollerDigit${6 - d}`) : null));
    this.lastDisplayedRollerValues = new Array(7).fill(-1);
    this.cachedHudScoreEl = (typeof document !== 'undefined' ? document.getElementById('hudScore') : null);
    this.lastScoreInt = -1;
  }

  setMasterVolume(val, muted = false) {
    this.masterVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    this.masterMuted = !!muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_master_volume', this.masterVolume.toString());
      localStorage.setItem('beatstar_master_muted', this.masterMuted.toString());
    }
    if (this.sync && this.sync.setVolume) {
      this.sync.setVolume(this.masterVolume, this.masterMuted);
    }
    if (this.synth && this.synth.setVolume) {
      this.synth.setVolume(this.masterVolume, this.masterMuted);
    }
  }

  unlockAudio() {
    if (this.sync && this.sync.unlockAudio) {
      this.sync.unlockAudio();
    }
    if (this.synth && this.synth.ensureContext) {
      this.synth.ensureContext();
    }
  }

  onAudioReady() {
    console.log('[BeatstarEngine] Audio track ready and buffered.');
  }

  onAudioEnded() {
    console.log('[BeatstarEngine] Audio reached end of stream.');
    if (this.isRunning && !this.isGameOver && this.beatmapData) {
      setTimeout(() => this.triggerGameEnd(), 350);
    }
  }

  onAudioError(msg) {
    console.warn('[BeatstarEngine] Audio warning/error:', msg);
  }

  getScoreColor(type) {
    const jc = this.judgeColors || {};
    switch (type) {
      case 'perfectPlus':
      case 'PERFECT+':
        return jc.perfectPlus || '#00f5a0';
      case 'perfect':
      case 'PERFECT':
        return jc.perfect || '#ffd700';
      case 'great':
      case 'GREAT':
        return jc.great || '#00d4ff';
      case 'good':
      case 'GOOD':
        return jc.good || '#ff7b00';
      case 'miss':
      case 'MISS':
        return '#ff1744';
      default:
        return '#00f5a0';
    }
  }

  getJudgeGlowColor(type) {
    const raw = this.getScoreColor(type);
    if (!raw || raw.toLowerCase() === '#ffffff' || raw.toLowerCase() === '#fff') {
      switch (type) {
        case 'perfectPlus':
        case 'PERFECT+':
          return '#00f5a0';
        case 'perfect':
        case 'PERFECT':
          return '#ffd700';
        case 'great':
        case 'GREAT':
          return '#00d4ff';
        case 'good':
        case 'GOOD':
          return '#ff7b00';
        default:
          return '#00f5a0';
      }
    }
    return raw;
  }

  setVisualDimension(dim) {
    this.visualDimension = (dim === '2d') ? '2d' : '3d';
    this._hitSpriteSocket = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_visual_dimension', this.visualDimension);
    }
  }

  setKeyStyle(style) {
    this.keyStyle = (style === 'compact') ? 'compact' : 'beatstar_large';
    this._hitSpriteSocket = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_key_style', this.keyStyle);
    }
  }

  normalizeEffectId(rawId) {
    const LEGACY_MAP = {
      default_neon: 'solar_inferno',
      royal_brass: 'solar_inferno',
      fire_inferno: 'solar_inferno',
      crimson_royale: 'solar_inferno',
      acoustic_resonance: 'cryo_blizzard',
      luminous_ivory: 'aurora_borealis',
      paint_splash: 'cyber_neon',
      color_burst: 'cyber_neon',
      full_focus_base: 'zeus_lightning',
      full_focus_fireworks: 'grand_fireworks',
      full_focus_electric: 'zeus_lightning',
      emerald_symphony: 'dragon_fire',
      amethyst_vortex: 'deep_cosmos',
      diamond_supernova: 'supernova_burst'
    };
    const validIds = new Set([
      'solar_inferno',
      'cryo_blizzard',
      'cyber_neon',
      'grand_fireworks',
      'zeus_lightning',
      'deep_cosmos',
      'asteroid_impact',
      'black_hole',
      'dragon_fire',
      'aurora_borealis',
      'supernova_burst',
      'quantum_prism',
      'astral_transcendence'
    ]);
    if (validIds.has(rawId)) return rawId;
    return LEGACY_MAP[rawId] || 'solar_inferno';
  }

  emitKeyHit(x, y, color = '#ffdf9e', count = 24) {
    const isRiver = Boolean(this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive));
    if (isRiver) {
      if (typeof this._emitRiverSplash === 'function') {
        this._emitRiverSplash(x, y - 4, 1.05, Math.min(18, Math.max(10, Math.round(count * 0.65))), false);
      }
      if (typeof this._emitRiverTapRipple === 'function') {
        this._emitRiverTapRipple(x, y, 1.05, true);
      }
      const waterPal = ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#00f2fe', '#34d399'];
      const dropCount = Math.min(count, 22);
      for (let i = 0; i < dropCount; i++) {
        const p = this.particles.spawnParticle();
        if (!p) break;
        const angle = -Math.PI * (0.12 + Math.random() * 0.76);
        const speed = 110 + Math.random() * 220;
        p.x = x + (Math.random() - 0.5) * 26;
        p.y = y + (Math.random() - 0.5) * 8;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed - 45;
        p.gravity = 320;
        p.drag = 0.96;
        p.radius = 2.4 + Math.random() * 3.8;
        p.color = waterPal[i % waterPal.length];
        p.alpha = 0.95;
        p.decay = 2.0 + Math.random() * 1.1;
        p.type = 'circle';
        p.rotation = 0;
        p.rotSpeed = 0;
        p.scaleX = 0.85;
        p.scaleY = 1.25;
      }
      return;
    }

    const fx = this.normalizeEffectId(this.activeEffect);
    this.activeEffect = fx;

    const paletteByFx = {
      solar_inferno: ['#ffffff', '#fde047', '#fb923c', '#ff3300', '#dc2626'],
      cryo_blizzard: ['#ffffff', '#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7'],
      cyber_neon: ['#ff007f', '#00f2fe', '#ffe600', '#a855f7', '#39ff14'],
      grand_fireworks: ['#ffd700', '#ff0055', '#00ff88', '#00f2fe', '#e879f9', '#ffffff'],
      zeus_lightning: ['#ffffff', '#a5f3fc', '#00f2fe', '#818cf8', '#c084fc'],
      deep_cosmos: ['#c084fc', '#f472b6', '#38bdf8', '#fde047', '#818cf8'],
      asteroid_impact: ['#fde047', '#fb923c', '#ea580c', '#dc2626', '#78350f'],
      black_hole: ['#f97316', '#ec4899', '#a855f7', '#fde047', '#38bdf8'],
      dragon_fire: ['#fde047', '#34d399', '#10b981', '#059669', '#a7f3d0'],
      aurora_borealis: ['#2dd4bf', '#34d399', '#38bdf8', '#c084fc', '#f472b6'],
      supernova_burst: ['#ffffff', '#fde047', '#ff007f', '#00f2fe', '#a855f7'],
      quantum_prism: ['#39ff14', '#00f2fe', '#a855f7', '#ffffff', '#fde047'],
      astral_transcendence: ['#ffffff', '#fde047', '#00f2fe', '#ff007f', '#a855f7', '#39ff14']
    };

    const pal = paletteByFx[fx] || paletteByFx.solar_inferno;
    const isTranscendent = (fx === 'astral_transcendence');
    const effCount = isTranscendent ? Math.min(34, count + 8) : count;

    for (let i = 0; i < effCount; i++) {
      const p = this.particles.spawnParticle();
      if (!p) break;

      const isRising = (fx === 'solar_inferno' || fx === 'dragon_fire' || fx === 'aurora_borealis' || isTranscendent);
      const angle = isTranscendent
        ? (i * 2.3999632) // Golden-angle phyllotaxis harmonic spiral
        : (isRising
            ? (-Math.PI / 2 + (Math.random() - 0.5) * 1.35)
            : (Math.random() * Math.PI * 2));
      const speed = isTranscendent ? (115 + (i % 5) * 52) : (95 + Math.random() * 250);

      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y + (Math.random() - 0.5) * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - (isRising ? 85 : 30);
      p.gravity = isTranscendent ? -65 : (isRising ? -95 : (fx === 'grand_fireworks' || fx === 'asteroid_impact' ? 280 : 45));
      p.drag = 0.94;
      p.radius = (isTranscendent ? 3.0 : 2.6) + Math.random() * 4.2;
      p.color = pal[i % pal.length];
      p.alpha = 1.0;
      p.decay = 2.0 + Math.random() * 1.1;
      p.type = (i % 2 === 0) ? 'glitter_star' : 'diamond_spark';
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 14;
      p.scaleX = 1;
      p.scaleY = 1;
    }

    if (fx === 'zeus_lightning' || fx === 'cyber_neon' || fx === 'supernova_burst' || isTranscendent) {
      const w = this.width || 360;
      const h = this.height || 740;
      if (isTranscendent) {
        // Connect the floating Horizon Seraphim Crown directly to the struck key with twin celestial arcs
        this.particles.spawnLightningArc(w * 0.5, h * 0.11, x, y, '#00f2fe');
        this.particles.spawnLightningArc(x - 78, y - 24, x + 78, y - 24, '#fde047');
        if (this.combo > 0 && this.combo % 15 === 0) {
          this._transcendentResonancePulse = 1.0;
        }
      } else {
        this.particles.spawnLightningArc(x + (Math.random() - 0.5) * 90, h * 0.16, x, y, pal[1]);
        this.particles.spawnLightningArc(x - 65, y - 35, x + 65, y - 10, pal[2]);
      }
    }
  }

  setActiveEffect(effectId) {
    this.activeEffect = this.normalizeEffectId(effectId);
    localStorage.setItem('beatstar_active_effect', this.activeEffect);
  }

  initCustomBackground() {
    try {
      const rawData = typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_custom_bg_data') : null;
      if (rawData) {
        if (rawData.startsWith('data:video') || rawData.endsWith('.mp4') || rawData.endsWith('.webm')) {
          this.setCustomBackground(rawData, 'video', this.customBgMode, this.customBgOpacity);
        } else {
          this.setCustomBackground(rawData, 'image', this.customBgMode, this.customBgOpacity);
        }
      }
    } catch (e) {
      console.warn('Could not load custom background from storage:', e);
    }
  }

  setCustomBackground(mediaSource, mediaType = 'image', mode = null, opacity = null) {
    if (mode !== undefined && mode !== null) {
      this.customBgMode = mode;
      localStorage.setItem('beatstar_bg_mode', mode);
    }
    if (opacity !== undefined && opacity !== null) {
      this.customBgOpacity = parseFloat(opacity) || 0.40;
      localStorage.setItem('beatstar_bg_opacity', this.customBgOpacity.toString());
    }

    if (mediaSource !== undefined && mediaSource !== null) {
      if (mediaSource === '' || mediaSource === 'none') {
        if (this.customBgVideo) {
          try { this.customBgVideo.pause(); } catch(e) {}
          this.customBgVideo = null;
        }
        this.customBgMedia = null;
        this.customBgMediaType = null;
        localStorage.removeItem('beatstar_custom_bg_data');
      } else if (mediaType === 'video' || (typeof mediaSource === 'string' && (mediaSource.startsWith('data:video') || mediaSource.includes('.mp4') || mediaSource.includes('.webm') || (mediaSource.startsWith('blob:') && mediaType !== 'image')))) {
        // HTML5 Video Element
        if (!this.customBgVideo) {
          this.customBgVideo = document.createElement('video');
          this.customBgVideo.muted = true;
          this.customBgVideo.defaultMuted = true;
          this.customBgVideo.loop = true;
          this.customBgVideo.playsInline = true;
          this.customBgVideo.setAttribute('muted', '');
          this.customBgVideo.setAttribute('playsinline', '');
          this.customBgVideo.setAttribute('webkit-playsinline', '');
          this.customBgVideo.autoplay = true;
        }
        if (typeof mediaSource === 'string' && (mediaSource.startsWith('http://') || mediaSource.startsWith('https://'))) {
          this.customBgVideo.crossOrigin = 'anonymous';
        } else {
          this.customBgVideo.removeAttribute('crossOrigin');
        }
        this.customBgVideo.src = mediaSource;
        this.customBgVideo.load();
        const p = this.customBgVideo.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        this.customBgMedia = this.customBgVideo;
        this.customBgMediaType = 'video';
      } else {
        // HTML Image Element
        if (this.customBgVideo) {
          try { this.customBgVideo.pause(); } catch(e) {}
          this.customBgVideo = null;
        }
        const img = new Image();
        if (typeof mediaSource === 'string' && (mediaSource.startsWith('http://') || mediaSource.startsWith('https://'))) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          this.customBgMedia = img;
          this.customBgMediaType = 'image';
        };
        img.src = mediaSource;
        this.customBgMedia = img;
        this.customBgMediaType = 'image';
      }
    }
  }

  setCustomBgTransform(cropX = 0.5, cropY = 0.5, zoom = 1.0, fit = 'cover') {
    this.customBgCropX = Math.max(0, Math.min(1, parseFloat(cropX) ?? 0.5));
    this.customBgCropY = Math.max(0, Math.min(1, parseFloat(cropY) ?? 0.5));
    this.customBgZoom = Math.max(0.5, Math.min(3.0, parseFloat(zoom) ?? 1.0));
    this.customBgFit = fit || 'cover';
    localStorage.setItem('beatstar_bg_crop_x', this.customBgCropX.toString());
    localStorage.setItem('beatstar_bg_crop_y', this.customBgCropY.toString());
    localStorage.setItem('beatstar_bg_crop_zoom', this.customBgZoom.toString());
    localStorage.setItem('beatstar_bg_fit', this.customBgFit);
  }

  drawCoverMedia(ctx, media, targetW, targetH) {
    if (!media) return;
    let mw = 0;
    let mh = 0;
    if (media instanceof HTMLVideoElement) {
      mw = media.videoWidth;
      mh = media.videoHeight;
      if (media.paused && !media.ended) {
        media.play().catch(() => {});
      }
    } else if (media instanceof HTMLImageElement) {
      mw = media.naturalWidth || media.width;
      mh = media.naturalHeight || media.height;
    }
    if (!mw || !mh) return;

    const fit = this.customBgFit || 'cover';
    const zoom = Math.max(0.5, Math.min(3.0, this.customBgZoom || 1.0));
    const cropX = (this.customBgCropX !== undefined) ? this.customBgCropX : 0.5;
    const cropY = (this.customBgCropY !== undefined) ? this.customBgCropY : 0.5;

    let baseScale = (fit === 'contain') 
      ? Math.min(targetW / mw, targetH / mh)
      : Math.max(targetW / mw, targetH / mh);

    const scale = baseScale * zoom;
    const sw = mw * scale;
    const sh = mh * scale;

    const dx = (targetW - sw) * cropX;
    const dy = (targetH - sh) * cropY;

    ctx.drawImage(media, dx, dy, sw, sh);
  }

  setPCKeybind(lane, key) {
    if (lane >= 0 && lane <= 2 && key) {
      this.pcKeybinds[lane] = key.toLowerCase();
      localStorage.setItem('beatstar_pc_keybinds', JSON.stringify(this.pcKeybinds));
    }
  }

  addReactiveBurst(lane, x, y, color = '#00f2fe') {
    const hitX = (x !== undefined && x !== null) ? x : (lane + 0.5) * this.laneWidth;
    const hitY = (y !== undefined && y !== null) ? y : this.hitLineY;
    this.bgBursts.push({
      type: 'reactive_reveal',
      lane,
      x: hitX,
      y: hitY,
      radius: 40,
      maxRadius: Math.max(this.width, this.height) * 0.75,
      alpha: 1.0,
      decay: 1.6,
      color: color || '#00f2fe'
    });
    // Boost reactive ambient light: more hits = brighter scene!
    this.reactiveLightBoost = Math.min(1.0, (this.reactiveLightBoost || 0) + 0.22);
    this.lastHitColor = color || '#00f2fe';
  }

  triggerScreenShake(intensity = 2.0, durationMs = 50) {
    // Vibración visual de pantalla desactivada para evitar que la pista tiemble al pulsar 2 teclas a la vez
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  setJudgeColors(colors) {
    this.judgeColors = Object.assign(this.judgeColors || {}, colors);
    this._laneTapGradCache = null;
    this._judgementSpriteCache = null;
    localStorage.setItem('beatstar_judge_colors', JSON.stringify(this.judgeColors));
  }

  setLatencyOffset(offsetMs) {
    this.latencyOffsetMs = parseInt(offsetMs, 10) || 0;
    localStorage.setItem('beatstar_offset', this.latencyOffsetMs.toString());
  }

  setContinueMode(enabled) {
    this.continueMode = !!enabled;
    localStorage.setItem('beatstar_continue_mode', this.continueMode.toString());
  }

  setNoteSpeedMultiplier(multiplier) {
    this.noteSpeedMultiplier = parseFloat(multiplier) || 1.0;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('beatstar_note_speed', this.noteSpeedMultiplier.toString());
    }
    const base = this.baseScrollDurationMs || 1400;
    const mult = Math.max(0.7, Math.min(2.0, this.noteSpeedMultiplier || 1.0));
    this.scrollDurationMs = Math.round(base / mult);
  }

  setSongPlaybackSpeed(speed) {
    const s = Math.max(0.5, Math.min(2.0, parseFloat(speed) || 1.0));
    this.songPlaybackRate = s;
    if (this.sync) {
      this.sync.setPlaybackRate(s);
    }
    if (this.audioSync && this.audioSync !== this.sync) {
      this.audioSync.setPlaybackRate(s);
    }
  }

  initCanvasSize() {
    const rect = (this.canvas && this.canvas.getBoundingClientRect) ? this.canvas.getBoundingClientRect() : { left: 0, top: 0, right: 360, bottom: 640, width: 360, height: 640 };
    const viewport = typeof document !== 'undefined' ? document.querySelector('.game-viewport') : null;
    const vpRect = (viewport && viewport.getBoundingClientRect) ? viewport.getBoundingClientRect() : null;

    this.width = rect.width || (vpRect ? vpRect.width : 0) || (typeof window !== 'undefined' ? window.innerWidth : 360) || 360;
    this.height = rect.height || (vpRect ? vpRect.height : 0) || (typeof window !== 'undefined' ? window.innerHeight : 640) || 640;
    this._canvasRect = (rect && rect.width > 0) ? rect : (vpRect && vpRect.width > 0 ? vpRect : { left: 0, top: 0, right: this.width, bottom: this.height, width: this.width, height: this.height });
    this.isFourLanesModeActive = Boolean(
      (typeof window !== 'undefined' && (window.isFourLanesModeActive || window.currentGameMode === 'four_lanes')) ||
      this.isFourLanesModeActive
    );
    this.numLanes = this.isFourLanesModeActive ? 4 : 3;
    this.laneWidth = this.width / this.numLanes;
    this.hitLineY = this.height * 0.82;

    // Constantes precalculadas para proyección cónica 3D (Zero-GC en renderNotes y getLaneBoundaryX)
    // En 4 carriles abrimos la anchura base al 98.5% y el horizonte al 64% para carriles mucho más anchos y cómodos
    this._perspHorizonY = 12;
    this._perspHitY = this.hitLineY;
    this._perspSpanY = Math.max(1, this._perspHitY - this._perspHorizonY);
    this._perspInvSpanY = 1.0 / this._perspSpanY;
    this._perspMidX = this.width * 0.5;
    this._perspCachedLanes = this.numLanes;
    const widthFactor = (this.numLanes === 4) ? 0.985 : 0.94;
    this._perspBaseLaneW = (this.width * widthFactor) / this.numLanes;
    this._perspMinScale = (this.numLanes === 4) ? 0.64 : 0.50;
    this._perspCurveExp = (this.numLanes === 4) ? 1.48 : 1.70;

    // ⚡ OPTIMIZADO PARA 120 FPS ESTABLES: DPR 1.5 en móviles (ahorra 44% de fill-rate de GPU manteniendo nitidez Retina)
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const dprCap = isMobile ? 1.5 : 2.0;
    this.dpr = Math.min(window.devicePixelRatio || 1, dprCap);

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    if (this.ctx) {
      if (typeof this.ctx.setTransform === 'function') {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      this.ctx.scale(this.dpr, this.dpr);
    }

    // Degradado 3D nacarado de alta gama para la autopista blanca con volumen tridimensional real
    const horizonY = 12;
    const bottomY = this.height + 30;
    this._trackGrad = this.ctx.createLinearGradient(this.width / 2, horizonY, this.width / 2, bottomY);
    this._trackGrad.addColorStop(0.00, '#64748b');
    this._trackGrad.addColorStop(0.08, '#94a3b8');
    this._trackGrad.addColorStop(0.18, '#cbd5e1');
    this._trackGrad.addColorStop(0.32, '#e2e8f0');
    this._trackGrad.addColorStop(0.50, '#f1f5f9');
    this._trackGrad.addColorStop(0.70, '#f8fafc');
    this._trackGrad.addColorStop(0.86, '#ffffff');
    this._trackGrad.addColorStop(1.00, '#dbeafe');

    // Sombra atmosférica 3D suavemente difuminada al final de la pista (horizonte) sin bloques negros
    const shadowEnd = horizonY + (this.hitLineY - horizonY) * 0.30;
    this._trackHorizonShadowGrad = this.ctx.createLinearGradient(0, horizonY, 0, shadowEnd);
    this._trackHorizonShadowGrad.addColorStop(0.00, 'rgba(6, 8, 20, 0.84)');
    this._trackHorizonShadowGrad.addColorStop(0.16, 'rgba(8, 12, 28, 0.62)');
    this._trackHorizonShadowGrad.addColorStop(0.36, 'rgba(12, 18, 40, 0.38)');
    this._trackHorizonShadowGrad.addColorStop(0.60, 'rgba(16, 25, 52, 0.16)');
    this._trackHorizonShadowGrad.addColorStop(0.82, 'rgba(20, 32, 64, 0.05)');
    this._trackHorizonShadowGrad.addColorStop(1.00, 'rgba(20, 32, 64, 0.00)');

    // Brillo especular cilíndrico 3D sobre la pista con oclusión suave en los bordes laterales
    this._trackEdgeShadowGrad = this.ctx.createLinearGradient(0, 0, this.width, 0);
    this._trackEdgeShadowGrad.addColorStop(0.00, 'rgba(51, 65, 85, 0.32)');
    this._trackEdgeShadowGrad.addColorStop(0.14, 'rgba(100, 116, 139, 0.12)');
    this._trackEdgeShadowGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.08)');
    this._trackEdgeShadowGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.45)');
    this._trackEdgeShadowGrad.addColorStop(0.70, 'rgba(255, 255, 255, 0.08)');
    this._trackEdgeShadowGrad.addColorStop(0.86, 'rgba(100, 116, 139, 0.12)');
    this._trackEdgeShadowGrad.addColorStop(1.00, 'rgba(51, 65, 85, 0.32)');

    // Degradados de fondo cacheados (evita crearlos 120 veces por segundo)
    const h = this.height;
    const bgStops = [
      [[0.0, '#060310'], [0.45, '#0e0920'], [0.80, '#181030'], [1.0, '#0e081e']],
      [[0.0, '#0d0716'], [0.40, '#221509'], [0.75, '#361d0d'], [1.0, '#180d07']],
      [[0.0, '#140324'], [0.40, '#32063e'], [0.75, '#500a5e'], [1.0, '#240430']],
      [[0.0, '#031224'], [0.40, '#082d4f'], [0.75, '#0c4472'], [1.0, '#061e35']],
      [[0.0, '#100322'], [0.35, '#2b0846'], [0.70, '#4a116d'], [1.0, '#220836']]
    ];
    this._bgGrads = [];
    for (let m = 0; m < 5; m++) {
      const g = this.ctx.createLinearGradient(0, 0, 0, h);
      for (let s = 0; s < bgStops[m].length; s++) {
        g.addColorStop(bgStops[m][s][0], bgStops[m][s][1]);
      }
      this._bgGrads[m] = g;
    }

    // Invalidar sprites precompilados (cambia el tamaño del canvas)
    this._hitSprites = null;
    this._hitSpriteSocket = null;
    this._hitSpriteKeyIdle = null;
    this._hitSpriteKeyPressed = null;
    this._laneFloodGradCache = {};

    // Caché de font strings (Zero-GC: elimina template literal + Skia re-parse por nota)
    this._fontCache = {};
    for (let s = 11; s <= 30; s++) {
      this._fontCache[s] = `900 ${s}px Montserrat, -apple-system, sans-serif`;
    }

    // Caché de geometría para sideGrad de renderLanes (evita createLinearGradient por frame)
    this._sideGradGeom = { horizonY: 12, bottomY: this.height + 30 };
    this._sideGradCache = null;
    this._sideGradHue = -1;
  }

  bindEvents() {
    if (this._touchBound) return;
    this._touchBound = true;

    window.addEventListener('resize', () => this.initCanvasSize());

    // ⚡ ENTRADA TÁCTIL (TOUCH) A NIVEL DE VENTANA SIN REFLOWS DE DOM NI GESTURE DELAY
    window.addEventListener('touchstart', (e) => {
      if ((!this.isRunning && !this.isCountingDown && !this.isCalibrating) || this.isPaused || this.isRewinding) return;
      const targetEl = e.target;
      if (targetEl !== this.canvas) return;

      if (this.isRunning && e.cancelable) {
        e.preventDefault();
      }

      const now = performance.now();
      this.lastTouchTime = now;
      let rect = this._canvasRect;
      if (!rect || rect.width <= 0) {
        rect = this.canvas.getBoundingClientRect();
        this._canvasRect = rect;
      }
      if (!rect || rect.width <= 0) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX < rect.left || t.clientX > rect.right) continue;

        const lane = this.resolveTouchLane(t.clientX, t.clientY, rect, true);

        const consumed = this.triggerLaneInput(lane, 'tap', null, t.identifier);

        // Guardar origen de toque; si ya consumió una nota tap/hold, bloquear swipe secundario para no tocar 2 notas con 1 dedo
        this.activeTouches.set(t.identifier, {
          startX: t.clientX,
          startY: t.clientY,
          startTime: now,
          lane: lane,
          swiped: false,
          consumed: Boolean(consumed)
        });
      }
    }, { passive: false });

    // ⚡ DETECCIÓN DE DESLIZAMIENTO / FLICK (SWIPE) — Solo si el toque inicial no consumió ya una tecla tap/hold y no estamos en Modo Carretera
    window.addEventListener('touchmove', (e) => {
      if (this.isPaused || this.isRewinding || this.isHighwayModeActive) return;
      const now = performance.now();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tData = this.activeTouches.get(t.identifier);
        if (!tData || tData.swiped || tData.consumed) continue;

        const dx = t.clientX - tData.startX;
        const dy = t.clientY - tData.startY;
        const distSq = dx * dx + dy * dy;
        const elapsed = now - tData.startTime;

        // Umbral de activación natural de swipe (18px -> 324px² en menos de 500ms)
        if (distSq > 324 && elapsed < 500) {
          let direction = 'up';
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else {
            direction = dy > 0 ? 'down' : 'up';
          }

          tData.swiped = true;
          tData.consumed = true;
          this.triggerLaneInput(tData.lane, 'swipe', direction, t.identifier);
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const rect = this._canvasRect;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tData = this.activeTouches.get(t.identifier);
        if (tData) {
          this.releaseLaneHold(tData.lane, t.identifier);
          this.activeTouches.delete(t.identifier);
        } else if (rect && rect.width > 0) {
          const lane = this.resolveTouchLane(t.clientX, t.clientY, rect, false);
          this.releaseLaneHold(lane, t.identifier);
        }
      }
    }, { passive: true });

    window.addEventListener('touchcancel', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const tData = this.activeTouches.get(t.identifier);
        if (tData) {
          this.releaseLaneHold(tData.lane, t.identifier);
          this.activeTouches.delete(t.identifier);
        }
      }
    }, { passive: true });

    // ⚡ RATÓN PC CON SOPORTE DE ARRASTRE PARA SWIPE (0 reflows de DOM)
    window.addEventListener('mousedown', (e) => {
      const now = performance.now();
      if (now - (this.lastTouchTime || 0) < 500) return;
      if ((!this.isRunning && !this.isCountingDown && !this.isCalibrating) || this.isPaused || this.isRewinding) return;

      const targetEl = e.target;
      if (targetEl !== this.canvas) return;

      let rect = this._canvasRect;
      if (!rect || rect.width <= 0) {
        rect = this.canvas.getBoundingClientRect();
        this._canvasRect = rect;
      }
      if (!rect || rect.width <= 0) return;
      if (e.clientX < rect.left || e.clientX > rect.right) return;

      const lane = this.resolveTouchLane(e.clientX, e.clientY, rect, true);

      const consumed = this.triggerLaneInput(lane, 'tap', null, 'mouse');

      this.mouseTouch = {
        startX: e.clientX,
        startY: e.clientY,
        startTime: now,
        lane: lane,
        swiped: false,
        consumed: Boolean(consumed)
      };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.mouseTouch || this.mouseTouch.swiped || this.mouseTouch.consumed || this.isHighwayModeActive || this.isPaused || this.isRewinding) return;
      const dx = e.clientX - this.mouseTouch.startX;
      const dy = e.clientY - this.mouseTouch.startY;
      const distSq = dx * dx + dy * dy;
      const elapsed = performance.now() - this.mouseTouch.startTime;

      if (distSq > 324 && elapsed < 500) {
        let direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        this.mouseTouch.swiped = true;
        this.mouseTouch.consumed = true;
        this.triggerLaneInput(this.mouseTouch.lane, 'swipe', direction, 'mouse');
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.mouseTouch) {
        this.releaseLaneHold(this.mouseTouch.lane, 'mouse');
        this.mouseTouch = null;
      }
    });

    // ⚡ TECLADO PC (D, F, J y Flechas para Swipe)
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (!this.isCalibrating && this.beatmapData) {
          if (this.isPaused) {
            if (this.ui.onResume) this.ui.onResume();
          } else {
            if (this.ui.onTogglePause) this.ui.onTogglePause();
          }
          return;
        }
      }
      if (this.isPaused || this.isRewinding || this.isCountingDown) return;

      const k = (e.key || '').toLowerCase();
      const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j', 3: 'k' };

      if ((this.numLanes || 3) === 4) {
        if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.triggerLaneInput(0, 'tap');
        else if (k === (kb[1] || 'f') || k === 's' || k === '2') this.triggerLaneInput(1, 'tap');
        else if (k === (kb[2] || 'j') || k === '3') this.triggerLaneInput(2, 'tap');
        else if (k === (kb[3] || 'k') || k === 'l' || k === '4') this.triggerLaneInput(3, 'tap');
      } else {
        if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.triggerLaneInput(0, 'tap');
        else if (k === (kb[1] || 'f') || k === 's' || k === ' ' || k === '2') this.triggerLaneInput(1, 'tap');
        else if (k === (kb[2] || 'j') || k === 'k' || k === '3') this.triggerLaneInput(2, 'tap');
      }

      const handleArrowSwipe = (dir) => {
        const currentTime = this.getCurrentGameTimeMs(this._frameNow);
        let targetLane = -1;
        let bestDiff = Infinity;
        if (Array.isArray(this.notes)) {
          const startIdx = Math.max(0, (this.firstActiveNoteIndex || 0) - 2);
          for (let i = startIdx; i < this.notes.length; i++) {
            const n = this.notes[i];
            if (!n || n.hit || n.missed || n.holdCompleted || n.holding) continue;
            if (n.timestamp_ms - currentTime > 400) break;
            const diff = currentTime - n.timestamp_ms;
            const absDiff = Math.abs(diff);
            const isMirr = Boolean(this.isMirrorModeActive && n._isMirrored && (n.lane === 0 || n.lane === 2));
            const rawDir = (n.direction || 'up').toLowerCase();
            const reqDir = isMirr
              ? (rawDir === 'left' ? 'right' : (rawDir === 'right' ? 'left' : rawDir))
              : rawDir;
            if (absDiff <= 340 && n.type === 'swipe' && (!n.direction || reqDir === dir)) {
              if (absDiff < bestDiff) {
                bestDiff = absDiff;
                targetLane = isMirr ? (2 - n.lane) : n.lane;
              }
            }
          }
        }
        if (targetLane === -1) {
          targetLane = (dir === 'left' ? 0 : dir === 'right' ? ((this.numLanes || 3) - 1) : 1);
        }
        this.triggerLaneInput(targetLane, 'swipe', dir);
      };

      if (e.key === 'ArrowLeft') handleArrowSwipe('left');
      else if (e.key === 'ArrowRight') handleArrowSwipe('right');
      else if (e.key === 'ArrowUp') handleArrowSwipe('up');
      else if (e.key === 'ArrowDown') handleArrowSwipe('down');
    });

    window.addEventListener('keyup', (e) => {
      if (this.isPaused || this.isRewinding || this.isCountingDown) return;
      const k = (e.key || '').toLowerCase();
      const kb = this.pcKeybinds || { 0: 'd', 1: 'f', 2: 'j', 3: 'k' };

      if ((this.numLanes || 3) === 4) {
        if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.releaseLaneHold(0);
        else if (k === (kb[1] || 'f') || k === 's' || k === '2') this.releaseLaneHold(1);
        else if (k === (kb[2] || 'j') || k === '3') this.releaseLaneHold(2);
        else if (k === (kb[3] || 'k') || k === 'l' || k === '4') this.releaseLaneHold(3);
      } else {
        if (k === (kb[0] || 'd') || k === 'a' || k === '1') this.releaseLaneHold(0);
        else if (k === (kb[1] || 'f') || k === 's' || k === ' ' || k === '2') this.releaseLaneHold(1);
        else if (k === (kb[2] || 'j') || k === 'k' || k === '3') this.releaseLaneHold(2);
      }
    });
  }

  /**
   * Calculates optimal scroll duration (ms) based on difficulty stars and note density.
   * Tailored for realistic rhythm gameplay: higher difficulty provides faster scroll & wider note separation.
   */
  /**
   * Calculates optimal scroll duration (ms) based on difficulty stars.
   * Proporciona una variación tangible y palpable de velocidad según dificultad:
   * 1★: ~1700ms | 2.5★: ~1500ms | 3.5★: ~1360ms | 5★: ~1160ms | 7★+: ~890ms
   */
  computeDynamicScrollDuration(stars, rawNotes = []) {
    // Curva equilibrada optimizada para 120 FPS ultra fluidos sin tirones ni pixel skipping
    const s = Math.max(1.0, Math.min(10.0, parseFloat(stars) || 3.5));
    const duration = Math.round(1550 - (s - 1.0) * 45);
    return Math.max(1150, Math.min(1650, duration));
  }

  computeMaxPossibleScore(notes) {
    if (!notes || notes.length === 0) return 1;
    let simCombo = 0;
    let simScore = 0;
    for (const n of notes) {
      if (!n || n.isMine) continue;
      simCombo++;
      let mult = 1;
      if (simCombo >= 100) mult = 5;
      else if (simCombo >= 50) mult = 4;
      else if (simCombo >= 25) mult = 3;
      else if (simCombo >= 10) mult = 2;

      let basePts = 450;
      if (n.type === 'hold') {
        const durationSec = Math.max(0.15, ((n.duration_ms || 600) / 1000));
        basePts = 450 + Math.round(260 * durationSec);
      }
      simScore += basePts * mult;
    }
    return Math.max(1, simScore);
  }

  loadBeatmap(beatmapData, audioBlobOrUrl = null) {
    this.visualDimension = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) || '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';
    this.isCalibrating = false;
    this.beatmapData = beatmapData;
    this.activeSongPalette = (typeof getSongColorPalette === 'function') ? getSongColorPalette(beatmapData.metadata || beatmapData) : SONG_COLOR_PALETTES.classic;
    this._hitSpriteSocket = null; // el palette cambió → regenerar con el color nuevo
    if (this.ui && typeof this.ui.onSongLoaded === 'function') {
      this.ui.onSongLoaded(beatmapData.metadata || beatmapData, this.activeSongPalette);
    }
    this.currentAudioSource = audioBlobOrUrl || (beatmapData && beatmapData.audio_blob_url) || null;
    this.isFourLanesModeActive = Boolean(
      (typeof window !== 'undefined' && (window.isFourLanesModeActive || window.currentGameMode === 'four_lanes')) ||
      this.isFourLanesModeActive
    );
    this.numLanes = this.isFourLanesModeActive ? 4 : 3;
    this.laneGlows = [0, 0, 0, 0];
    this.fxRipples = [];
    this.bgBursts = [];
    this.musicalNotes = [];
    this.initCanvasSize();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.particles) {
      this.particles.reset();
    }
    this.flyingLyrics = [];
    this._lastCurLyricIndex = -1;
    if (typeof document !== 'undefined') {
      const curEl = document.getElementById('karaokeCurrentLine');
      if (curEl) curEl.innerHTML = '';
    }
    if (beatmapData && beatmapData.activeKaraokeLyrics && beatmapData.activeKaraokeLyrics.length > 0) {
      this.activeKaraokeLyrics = beatmapData.activeKaraokeLyrics;
    } else if (beatmapData && (beatmapData.lyrics || (beatmapData.metadata && beatmapData.metadata.lyrics))) {
      const bLyrics = beatmapData.lyrics || beatmapData.metadata.lyrics;
      if (typeof window !== 'undefined' && typeof window.parseTopLevelLyrics === 'function') {
        this.activeKaraokeLyrics = window.parseTopLevelLyrics(bLyrics);
        beatmapData.activeKaraokeLyrics = this.activeKaraokeLyrics;
      } else {
        this.activeKaraokeLyrics = [];
      }
    } else if (!this.activeKaraokeLyrics) {
      this.activeKaraokeLyrics = [];
    }

    // Extract real BPM and Beat Grid Offset
    this.bpm = Number.isFinite(beatmapData.metadata?.bpm) ? beatmapData.metadata.bpm : (Number.isFinite(beatmapData.bpm) ? beatmapData.bpm : 120);
    const beatDurationMs = 60000 / (this.bpm || 120);
    const firstRawTime = (beatmapData.notes && beatmapData.notes.length > 0)
      ? (Number.isFinite(beatmapData.notes[0].timestamp_ms)
          ? beatmapData.notes[0].timestamp_ms
          : (Number.isFinite(beatmapData.notes[0].timeMs)
              ? beatmapData.notes[0].timeMs
              : (Number.isFinite(beatmapData.notes[0].time) ? (beatmapData.notes[0].time > 100 ? beatmapData.notes[0].time : beatmapData.notes[0].time * 1000) : 0)))
      : 0;
    this.firstBeatOffsetMs = Number.isFinite(firstRawTime)
      ? (((firstRawTime % beatDurationMs) + beatDurationMs) % beatDurationMs)
      : 0;

    // Explicitly reset all game state flags
    this.isRunning = false;
    this.isPaused = true;
    this.isCountingDown = true;
    this.isGameOver = false;
    this.isInitialLaunch = true;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.missHighlight = null;
    this.lastMissTimePerf = 0;
    this.lastFailSongTimeSec = 0;

    // Extracción robusta y priorizada de estrellas de dificultad
    let diffStars = null;
    const dNameRaw = ((beatmapData.metadata?.difficulty_name || beatmapData.difficulty_name || '') + '');
    const starMatch = dNameRaw.match(/([0-9]+(?:\.[0-9]+)?)\s*★/);
    if (starMatch) {
      diffStars = parseFloat(starMatch[1]);
    }

    if (diffStars === null || !Number.isFinite(diffStars)) {
      if (Number.isFinite(beatmapData.selectedStars)) {
        diffStars = beatmapData.selectedStars;
      } else if (Number.isFinite(beatmapData.metadata?.stars) && beatmapData.metadata.stars !== 3.5) {
        diffStars = beatmapData.metadata.stars;
      } else if (Number.isFinite(beatmapData.stars) && beatmapData.stars !== 3.5) {
        diffStars = beatmapData.stars;
      } else if (Number.isFinite(beatmapData.difficulties?.[0]?.stars)) {
        diffStars = beatmapData.difficulties[0].stars;
      } else if (Number.isFinite(beatmapData.metadata?.stars)) {
        diffStars = beatmapData.metadata.stars;
      } else if (Number.isFinite(beatmapData.stars)) {
        diffStars = beatmapData.stars;
      }
    }

    // Inferencia por palabra clave si aún es nulo o 3.5 por defecto
    if (diffStars === null || diffStars === 3.5) {
      const dName = dNameRaw.toLowerCase();
      if (dName.includes('fácil') || dName.includes('easy') || dName.includes('beginner')) {
        diffStars = 1.5;
      } else if (dName.includes('media') || dName.includes('medium') || dName.includes('normal')) {
        diffStars = 3.5;
      } else if (dName.includes('difícil') || dName.includes('hard')) {
        diffStars = 5.5;
      } else if (dName.includes('extrema') || dName.includes('extreme') || dName.includes('expert')) {
        diffStars = 7.5;
      } else if (dName.includes('insana') || dName.includes('insane') || dName.includes('master')) {
        diffStars = 9.5;
      } else {
        diffStars = diffStars || 3.5;
      }
    }

    // Pass notes through LaneRemapper.sanitizeForTwoFingers to guarantee 2-finger compliance & density limit
    const rawNotes = (beatmapData && Array.isArray(beatmapData.notes)) ? beatmapData.notes.map((n, idx) => {
      let rawT = Number.isFinite(n.timestamp_ms)
        ? n.timestamp_ms
        : (Number.isFinite(n.timeMs)
            ? n.timeMs
            : (Number.isFinite(n.timestamp) ? n.timestamp : (Number.isFinite(n.time) ? (n.time > 100 ? n.time : n.time * 1000) : idx * 500)));
      if (!Number.isFinite(rawT)) rawT = idx * 500;
      rawT = Math.round(rawT);

      let rawDur = Number.isFinite(n.duration_ms)
        ? n.duration_ms
        : (Number.isFinite(n.holdDuration)
            ? (n.holdDuration > 50 ? n.holdDuration : n.holdDuration * 1000)
            : (Number.isFinite(n.duration) ? (n.duration > 50 ? n.duration : n.duration * 1000) : 0));
      if (!Number.isFinite(rawDur) || rawDur < 0) rawDur = 0;
      rawDur = Math.round(rawDur);

      const maxLaneIdx = (this.numLanes || 3) - 1;
      const laneVal = Math.max(0, Math.min(maxLaneIdx, parseInt(n.lane ?? n.column ?? n.track ?? 0, 10) || 0));
      const isHold = n.type === 'hold' || n.type === 'long' || rawDur > 0;
      const typeStr = isHold ? 'hold' : ((n.type === 'swipe' || n.type === 'slide') ? 'swipe' : 'tap');

      return {
        ...n,
        id: n.id !== undefined ? n.id : idx,
        lane: laneVal,
        column: laneVal,
        track: laneVal,
        type: typeStr,
        time: rawT / 1000,
        timeMs: rawT,
        timestamp_ms: rawT,
        duration_ms: rawDur,
        holdDuration: rawDur / 1000,
        end_timestamp_ms: isHold ? (rawT + Math.max(150, rawDur)) : null,
        lyric: (n.lyric !== undefined && n.lyric !== null && n.lyric !== '') ? n.lyric : (n.text || n.syllable || n.word || n.l || n.w || null),
        wordIdx: n.wordIdx !== undefined ? n.wordIdx : null,
        lineIdx: n.lineIdx !== undefined ? n.lineIdx : null,
        isInstrumental: Boolean(n.isInstrumental || n.is_instrumental || n.isInst)
      };
    }) : [];

    rawNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    // Bypass difficulty thinning & note-altering algorithms for all community / editor maps
    const isCommunity = !!(
      this.beatmapData.is_community || 
      this.beatmapData.isCommunity ||
      this.beatmapData.source === 'community' ||
      this.beatmapData.source === 'custom' ||
      this.beatmapData.source_name === 'Comunidad' || 
      this.beatmapData.source_name === 'Mi Creación' ||
      (this.beatmapData.metadata && (
        this.beatmapData.metadata.is_community || 
        this.beatmapData.metadata.isCommunity || 
        this.beatmapData.metadata.source === 'community' ||
        this.beatmapData.metadata.source === 'custom' ||
        this.beatmapData.metadata.source_name === 'Comunidad' ||
        this.beatmapData.metadata.source_name === 'Mi Creación'
      )) ||
      window.isPlaytestingFromEditor
    );

    const isStormActive = Boolean(this.isStormModeActive || (typeof window !== 'undefined' && window.isStormModeActive));
    const baseDensityMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_map_density') : null) || 'hard';
    const densityMode = (isStormActive && baseDensityMode === 'hard') ? 'extreme' : baseDensityMode;
    const effectiveStars = isStormActive ? Math.min(10.0, (diffStars || 3.5) + 1.2) : diffStars;
    let sanitizedNotes = rawNotes;
    if (!isCommunity && typeof LaneRemapper !== 'undefined') {
      if (
        this.beatmapData &&
        this.beatmapData._remappedForDensity === densityMode &&
        this.beatmapData._remappedForLanes === this.numLanes
      ) {
        // Ya fue remapeado desde las notas crudas con la densidad y número de carriles exactos
        sanitizedNotes = rawNotes;
      } else if (
        this.beatmapData &&
        Array.isArray(this.beatmapData.rawNotes) &&
        this.beatmapData.rawNotes.length > 0 &&
        LaneRemapper.resolveCollisions
      ) {
        sanitizedNotes = LaneRemapper.resolveCollisions(
          this.beatmapData.rawNotes,
          Number(this.beatmapData.keys || 4),
          this.bpm,
          effectiveStars,
          densityMode,
          this.numLanes
        );
      } else if (LaneRemapper.sanitizeForTwoFingers) {
        sanitizedNotes = LaneRemapper.sanitizeForTwoFingers(rawNotes, this.bpm, effectiveStars, densityMode, this.numLanes);
      }
    }

    // Set dynamic base scroll duration based on difficulty stars curve
    const baseScroll = this.computeDynamicScrollDuration(effectiveStars, sanitizedNotes);
    this.baseScrollDurationMs = baseScroll;

    // Apply the active note speed multiplier to the dynamic scroll duration (+12% velocidad eléctrica en Modo Tormenta)
    const speedMult = Math.max(0.5, Math.min(2.5, this.noteSpeedMultiplier || 1.0)) * (isStormActive ? 1.12 : 1.0);
    this.scrollDurationMs = Math.round(baseScroll / speedMult);
    console.log(`[BeatstarEngine] Diff: ${effectiveStars}★ ("${dNameRaw}") | Lanes: ${this.numLanes} | BaseScroll: ${baseScroll}ms | Mult: ${speedMult}x -> Final: ${this.scrollDurationMs}ms`);

    // Apply custom song playback rate if provided
    const songRate = Math.max(0.5, Math.min(2.0, parseFloat(this.beatmapData.songPlaybackSpeed) || 1.0));
    this.setSongPlaybackSpeed(songRate);

    // Sanitización y de-duplicación estricta cronológica para evitar notas solapadas en el mismo carril
    const sortedCandidateNotes = [...sanitizedNotes].sort((a, b) => {
      const tA = Number.isFinite(a.timestamp_ms) ? a.timestamp_ms : (a.timeMs || (a.time * 1000) || 0);
      const tB = Number.isFinite(b.timestamp_ms) ? b.timestamp_ms : (b.timeMs || (b.time * 1000) || 0);
      return tA - tB;
    });

    // Eliminar cualquier nota prematura (< 1600ms) para que nunca aparezcan notas antes de que arranque la canción
    let notesPool = sortedCandidateNotes.filter(n => {
      const t = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || (n.time * 1000) || 0);
      return t >= 1600;
    });
    if (notesPool.length === 0 && sortedCandidateNotes.length > 0) {
      const firstT = sortedCandidateNotes[0].timestamp_ms || sortedCandidateNotes[0].timeMs || 0;
      const shift = 1600 - firstT;
      notesPool = sortedCandidateNotes.map(n => {
        const origT = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || (n.time * 1000) || 0);
        const newT = origT + shift;
        return {
          ...n,
          timestamp_ms: newT,
          timeMs: newT,
          time: newT / 1000
        };
      });
    }

    const cleanedNotes = [];
    const lastLaneHitTime = [-Infinity, -Infinity, -Infinity, -Infinity];

    for (const n of notesPool) {
      const rawT = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || (n.time * 1000) || 0);
      const adjustedTime = Math.round(rawT);
      const laneVal = Math.max(0, Math.min((this.numLanes || 3) - 1, parseInt(n.lane ?? n.column ?? n.track ?? 0, 10) || 0));

      // Mantener todas las notas del beatmap sin descartar ninguna
      lastLaneHitTime[laneVal] = adjustedTime;

      let rawDur = Number.isFinite(n.duration_ms) ? n.duration_ms : (n.holdDuration ? n.holdDuration * 1000 : 0);
      if (!Number.isFinite(rawDur) || rawDur < 0) rawDur = 0;
      rawDur = Math.round(rawDur);

      // Micro-holds menores a 220ms se convierten en tap directo (en móvil un hold de 100ms es físicamente un tap)
      const isRealHold = (n.type === 'hold' || rawDur > 220) && rawDur > 220;
      let noteType = isRealHold ? 'hold' : (n.type === 'swipe' ? 'swipe' : 'tap');
      const isHighwayNow = Boolean((typeof window !== 'undefined' && (window.isHighwayModeActive || window.currentGameMode === 'highway')) || this.isHighwayModeActive);
      // En PC o en Modo Carretera, convertir automáticamente todos los swipes a notas normales de tap
      if ((this.isPCMode || isHighwayNow) && noteType === 'swipe') {
        noteType = 'tap';
      }
      const finalDur = isRealHold ? Math.max(220, rawDur) : 0;
      const adjustedEndTime = isRealHold ? (adjustedTime + finalDur) : null;

      cleanedNotes.push({
        ...n,
        id: n.id !== undefined ? n.id : cleanedNotes.length,
        lane: laneVal,
        column: laneVal,
        track: laneVal,
        type: noteType,
        time: adjustedTime / 1000,
        timeMs: adjustedTime,
        timestamp_ms: adjustedTime,
        duration_ms: finalDur,
        holdDuration: finalDur / 1000,
        end_timestamp_ms: adjustedEndTime,
        hit: false,
        holding: false,
        holdCompleted: false,
        missed: false,
        processed: false
      });
    }

    // Precalcular nextSameLaneDiffMs una sola vez para evitar loops anidados en cada frame de renderizado
    const cLen = cleanedNotes.length;
    for (let i = 0; i < cLen; i++) {
      const curN = cleanedNotes[i];
      let diff = Infinity;
      const maxJ = Math.min(cLen, i + 40);
      for (let j = i + 1; j < maxJ; j++) {
        const nextN = cleanedNotes[j];
        if (nextN.timestamp_ms - curN.timestamp_ms > 3000) break;
        if (nextN.lane === curN.lane && nextN.timestamp_ms > curN.timestamp_ms) {
          diff = nextN.timestamp_ms - curN.timestamp_ms;
          break;
        }
      }
      curN.nextSameLaneDiffMs = diff;
    }

    this.notes = cleanedNotes;
    // Si estamos en Modo Karaoke y tenemos letras, vincular o construir 1:1 desde las notas reales
    if (typeof window !== 'undefined' && window.isKaraokeModeActive) {
      if (this.activeKaraokeLyrics && this.activeKaraokeLyrics.length > 0) {
        if (typeof window.linkSyllablesToNotes === 'function') {
          window.linkSyllablesToNotes(this.notes, this.activeKaraokeLyrics);
        } else if (typeof window.linkExistingNotesToReconstructedLines === 'function') {
          window.linkExistingNotesToReconstructedLines(this.notes, this.activeKaraokeLyrics);
        }
        const teleBar = document.getElementById('karaokeTeleprompterBar');
        if (teleBar) teleBar.classList.remove('hidden');
      } else if (typeof window.buildLrcLinesFromExistingNotes === 'function') {
        const lines = window.buildLrcLinesFromExistingNotes(this.notes);
        if (lines && lines.length > 0) {
          this.activeKaraokeLyrics = lines;
          if (this.beatmapData) this.beatmapData.activeKaraokeLyrics = lines;
          const teleBar = document.getElementById('karaokeTeleprompterBar');
          if (teleBar) teleBar.classList.remove('hidden');
        }
      }
    }
    this.lastNoteTime = this.notes && this.notes.length > 0
      ? this.notes.reduce((max, n) => Math.max(max, n.end_timestamp_ms || n.timestamp_ms || 0), 0)
      : 0;

    this.firstActiveNoteIndex = 0;
    this.lastLitSyllableIndex = -1;
    // Pre-computar texto limpio de sílabas y pre-renderizar sprites de sílabas para Karaoke (0 rasterizado de fuentes en el render loop)
    if (!this._lyricKeySpriteCache) {
      this._lyricKeySpriteCache = new Map();
    }
    // Sincronizar de forma estricta los modos de juego para que ningún estado previo quede residual
    const curActiveMode = (typeof window !== 'undefined' && window.currentGameMode) ? window.currentGameMode : 'normal';
    this.isKaraokeModeActive = (curActiveMode === 'karaoke');
    this.isStormModeActive = (curActiveMode === 'storm');
    this.isMushroomModeActive = (curActiveMode === 'mushroom');
    this.isHighwayModeActive = (curActiveMode === 'highway');
    this.isAnnoyingDogModeActive = (curActiveMode === 'annoying_dog');
    this.isRiverModeActive = (curActiveMode === 'river');
    this.isMinesweeperModeActive = (curActiveMode === 'minesweeper');
    this.isMirrorModeActive = (curActiveMode === 'mirror');
    this.isEchoModeActive = (curActiveMode === 'echo');
    if (typeof window !== 'undefined') {
      window.isKaraokeModeActive = this.isKaraokeModeActive;
      window.isStormModeActive = this.isStormModeActive;
      window.isMushroomModeActive = this.isMushroomModeActive;
      window.isHighwayModeActive = this.isHighwayModeActive;
      window.isAnnoyingDogModeActive = this.isAnnoyingDogModeActive;
      window.isRiverModeActive = this.isRiverModeActive;
      window.isMinesweeperModeActive = this.isMinesweeperModeActive;
      window.isMirrorModeActive = this.isMirrorModeActive;
      window.isEchoModeActive = this.isEchoModeActive;
    }

    // En Modo Buscaminas: inyectar teclas extra trampa (Minas) asincrónicas en huecos libres
    this._mineExplosions = [];
    this._shatteredKeyFragments = [];
    this._mineFloatingPenalties = [];
    this._mineShakeIntensity = 0;
    if (this.isMinesweeperModeActive) {
      this._injectMinesweeperNotes();
    }

    // En Modo ECO (Doble golpe con rebote corto): preparar parejas rítmicas de rebote a 1 o 2 pulsos
    this._echoRipples = [];
    if (this.isEchoModeActive) {
      this.initEchoModeAssets();
      this._prepareEchoChoreography();
    }

    const isKaraokePrewarm = this.isKaraokeModeActive;
    const isMushPrewarm = this.isMushroomModeActive;
    const isHighwayPrewarm = this.isHighwayModeActive;
    const isDogPrewarm = this.isAnnoyingDogModeActive;
    const isRiverPrewarm = this.isRiverModeActive;
    for (let i = 0, nLen = this.notes.length; i < nLen; i++) {
      const n = this.notes[i];
      if (n.lyric && !_PROLONG_RE.test(String(n.lyric))) {
        _HYPHEN_RE.lastIndex = 0;
        n._cleanLyric = String(n.lyric).replace(_HYPHEN_RE, '$1 $2').trim().toUpperCase();
        if (isKaraokePrewarm && n._cleanLyric) {
          this._getLyricKeySprite(n._cleanLyric, false);
        }
      } else {
        n._cleanLyric = null;
      }

      // En modo Setas Alucinógenas: asignar fase de oscilación de grosor/tamaño y salto travieso de carril (~30% de notas)
      n._mushPhase = (i * 1.41) % (Math.PI * 2);
      n._mushColorIdx = i % 4;
      const prevT = i > 0 ? (this.notes[i - 1].timestamp_ms ?? 0) : -9999;
      const nextT = i + 1 < nLen ? (this.notes[i + 1].timestamp_ms ?? 9999999) : 9999999;
      const curT = n.timestamp_ms ?? 0;
      if (isMushPrewarm && n.type !== 'hold' && (curT - prevT > 240) && (nextT - curT > 240) && (i % 3 === 1)) {
        n._mushFromLane = (n.lane + ((i % 2 === 0) ? 1 : 2)) % 3;
      } else {
        n._mushFromLane = n.lane;
      }
      n._dogBatted = false;
      n._dogFromLane = n.lane;
      n._dogSwipeP = 0.40;
    }

    if (this.isStormModeActive) {
      this.initStormModeAssets();
    }
    // Resetear siempre el estado de Setas Alucinógenas al cargar cualquier beatmap
    this._mushFlipProgress = 0.0;
    this._mushTargetFlipped = false;
    this._mushNextFlipTimeMs = 9500;
    this._mushSafeGraceUntilMs = 0;
    this._mushInSafeTransition = false;
    this._mushTransitionClouds = [];
    this._mushBannerTimer = 0;
    if (isMushPrewarm) {
      this.initMushroomModeAssets();
      this._mushBannerText = '🍄 ¡MODO SETAS ALUCINÓGENAS! 🍄';
      this._mushBannerTimer = 2.6;
    }
    if (isHighwayPrewarm) {
      this.initHighwayModeAssets();
      this._prepareHighwayTrafficChoreography();
      this._hwBannerText = '🏎️ ¡AUTOPISTA ACTIVA: F1, TESLA ROADSTER Y TRENES! 🚂';
      this._hwBannerTimer = 2.8;
    }
    if (isDogPrewarm) {
      this.initAnnoyingDogModeAssets();
      this._prepareAnnoyingDogChoreography();
      this._dogBannerText = '🐶 ¡PERRO MOLESTO: CUIDADO CON LOS ZARPAZOS Y CHULETONES! 🥩';
      this._dogBannerTimer = 3.0;
    }
    if (isRiverPrewarm) {
      this.initRiverModeAssets();
      this._prepareRiverChoreography();
      this._riverBannerText = '';
      this._riverBannerTimer = 0;
    }
    this._mirrorWindows = [];
    this._mirrorCrossBeams = [];
    this._mirrorPhaseProgress = 0;
    this._mirrorFlipWave = 0;
    this._lastMirrorActiveState = false;
    if (this.isMirrorModeActive) {
      this.initMirrorModeAssets();
      this._prepareMirrorChoreography();
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stars = 0;
    this.lastCelebratedStar = 0;
    this.currentMedalTier = null;
    this.missCount = 0;
    this.invulnerableUntil = 0; // Sin auto-completado indebido de notas
    this.stats = { perfectPlus: 0, perfect: 0, great: 0, miss: 0 };
    this.timingStats = { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
    this.overdriveLevel = 0;
    this.overdriveFlash = 0;
    this._wasOverdrive = false;
    
    if (this.discoBall) {
      this.discoBall.active = false;
      this.discoBall.descendY = -120;
      this.discoBall.targetY = -120;
      this.discoBall.rotation = 0;
    }
    // Precalentamiento de audio synth y búferes para eliminar cualquier micro-lag en la primera tecla
    if (this.synth && typeof this.synth.ensureContext === 'function') {
      try { this.synth.ensureContext(); } catch (_) {}
    }
    if (!this.borderEqLeftSurges) this.borderEqLeftSurges = new Float32Array(16);
    if (!this.borderEqRightSurges) this.borderEqRightSurges = new Float32Array(16);
    this.borderEqLeftSurges.fill(0);
    this.borderEqRightSurges.fill(0);

    // Cálculo preciso de la puntuación máxima teórica (100% Perfect+ con multiplicadores)
    this.maxPossibleScore = this.computeMaxPossibleScore(this.notes);
    this.targetScore = this.maxPossibleScore;

    // Load audio track properly depending on type (Blob vs URL/String)
    if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
      try { window.pauseMenuAmbientMusic(); } catch (_) {}
    }
    if (audioBlobOrUrl instanceof Blob) {
      this.sync.loadAudioBlob(audioBlobOrUrl);
    } else if (typeof audioBlobOrUrl === 'string' && audioBlobOrUrl) {
      this.sync.loadAudioUrl(audioBlobOrUrl);
    } else if (beatmapData.audio_blob_url) {
      this.sync.loadAudioUrl(beatmapData.audio_blob_url);
    } else {
      this.sync.loadAudioUrl('');
    }

    this.sync.seekTo(0);
    this.sync.pause();

    if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
      this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, null, 0);
    }
    if (this.ui && typeof this.ui.onSongLoaded === 'function') {
      this.ui.onSongLoaded(beatmapData.metadata, this.activeSongPalette);
    }

    // Configuración del margen de entrada Lead-In: Reloj corre desde -LEAD_IN_TIME hasta 0
    this.isCountingDown = true;
    this.leadInDurationMs = LEAD_IN_TIME;
    this.leadInStartTime = performance.now();
    this.isRunning = true;
    this.isPaused = false;
    this.invulnerableUntil = 2400; // Protección post-arranque

    // El bucle de renderizado arranca inmediatamente para que las notas caigan desde el horizonte durante la cuenta atrás
    this.startLoop();

    if (this.ui && this.ui.onStartCountdown) {
      this.ui.onStartCountdown(this.leadInDurationMs);
    }
  }

  startNativeCalibration() {
    this.visualDimension = '3d';
    this.keyStyle = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_key_style') : null) || 'beatstar_large';
    this.isCalibrating = true;
    this.calibrationIntervalMs = this.isEffectDemoMode ? 720 : 1200;
    this.scrollDurationMs = 1150;
    this.isPaused = false;
    this.isGameOver = false;
    this.isRewinding = false;
    this.isCountingDown = false;
    this.firstActiveNoteIndex = 0;
    this._calibLaneCounter = 0;
    this.sync.pause();
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];

    this.initCanvasSize();
    this.synth.ensureContext();
    this.calibrationStartTime = performance.now();
    this.nextCalibNoteTime = performance.now() + 180;
    this.startLoop();
  }

  stopNativeCalibration() {
    this.isCalibrating = false;
    this.isEffectDemoMode = false;
    this.notes = [];
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.stop();
  }

  // ⚡ OPTIMIZADO: Pausa vídeo de fondo + bucle para evitar decodificación en menús
  pause() {
    if (!this.isCountingDown && !this.isGameOver && !this.isCalibrating && this.sync) {
      const curSec = (this.sync.getCurrentTimeMs() || 0) / 1000;
      if (curSec > 0) {
        this.lastPauseSongTimeSec = curSec;
      }
    }
    this.isPaused = true;
    this.isRunning = false;
    this.sync.pause();
    if (this.customBgVideo) {
      try { this.customBgVideo.pause(); } catch(e) {}
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume() {
    this.isPaused = false;
    this.isRunning = true;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.isCountingDown = false;
    this.missHighlight = null;
    this.lastMissTimePerf = performance.now();
    this.initCanvasSize();
    // Reanudar vídeo de fondo si estaba configurado
    if (this.customBgVideo && this.customBgVideo.paused && this.customBgMediaType === 'video') {
      const p = this.customBgVideo.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    this.sync.play();
    this.startLoop();
  }

  resumeFromPause() {
    if (!this.beatmapData || this.isGameOver || this.isCalibrating || this.isCountingDown) {
      this.resume();
      return;
    }
    const pauseTimeSec = (Number.isFinite(this.lastPauseSongTimeSec) && this.lastPauseSongTimeSec > 0)
      ? this.lastPauseSongTimeSec
      : ((this.sync.getCurrentTimeMs() || 0) / 1000);

    if (pauseTimeSec <= 0.35) {
      this.resume();
      return;
    }

    try {
      this.synth.playAnalogTapeRewind();
    } catch (e) {}

    const pauseTimeMs = pauseTimeSec * 1000;
    const fromTimeMs = pauseTimeMs + this.latencyOffsetMs;
    const rewindTargetSec = Math.max(0, pauseTimeSec - 2.0);
    const rewindTargetMs = rewindTargetSec * 1000;
    const toTimeMs = rewindTargetMs + this.latencyOffsetMs;

    this.sync.pause();
    this.sync.seekTo(rewindTargetSec);

    // Despejar las notas en el tramo inmediato de reanudación (como al revivir tras fallar)
    // para que el jugador tenga tiempo de reacción al quitar el pause y nunca muera al instante
    const clearThresholdMs = Math.max(pauseTimeMs + 60, rewindTargetMs + 1600);
    for (const note of this.notes) {
      const noteTime = note.timestamp_ms || 0;
      if (noteTime <= clearThresholdMs) {
        note.hit = true;
        note.missed = false;
        note.processed = true;
        note.holding = false;
        note.holdCompleted = true;
      } else {
        note.hit = false;
        note.missed = false;
        note.processed = false;
        note.holding = false;
        note.holdCompleted = false;
        note.missHighlight = false;
      }
    }

    this.firstActiveNoteIndex = 0;
    this.lastLitSyllableIndex = -1;
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.fxRipples = [];
    this.bgBursts = [];
    this.isProcessingMiss = false;
    this.missHighlight = null;
    this.lastMissTimePerf = performance.now();
    this.invulnerableUntil = pauseTimeMs + this.latencyOffsetMs + 2500;

    if (this.ui && this.ui.onShowRewindBadge) {
      this.ui.onShowRewindBadge();
    }

    this.isPaused = false;
    this.isGameOver = false;
    this.isCountingDown = false;
    this.initCanvasSize();

    this.animateRewind(fromTimeMs, toTimeMs, 600, () => {
      this.resume();
    });
  }

  renderRewindVFX(progress) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    ctx.save();
    // 1. Cyan tint vignette
    const alpha = Math.max(0, (1 - progress) * 0.4);
    ctx.fillStyle = `rgba(229, 184, 105, ${alpha * 0.12})`;
    ctx.fillRect(0, 0, w, h);

    // 2. Upward tape scanlines
    ctx.strokeStyle = `rgba(229, 184, 105, ${alpha * 0.35})`;
    ctx.lineWidth = 1.5;
    const numLines = 8;
    const speedOffset = (progress * 1600) % 70;
    for (let i = 0; i < numLines; i++) {
      const lineY = (h * 0.15 + i * 65 - speedOffset + h) % h;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(w, lineY);
      ctx.stroke();
    }

    // 3. Upward motion indicator
    const chevronAlpha = Math.sin(progress * Math.PI) * 0.75;
    if (chevronAlpha > 0.05) {
      ctx.fillStyle = `rgba(229, 184, 105, ${chevronAlpha})`;
      ctx.font = '900 20px "Cinzel", "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('▲ ▲ ▲', w / 2, this.hitLineY - 120 - (progress * 90));
    }
    ctx.restore();
  }

  animateRewind(fromTimeMs, toTimeMs, durationMs = 600, onComplete = null) {
    this.isRewinding = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const startPerf = performance.now();

    const rewindStep = (now) => {
      const elapsed = now - startPerf;
      const progress = Math.min(1.0, elapsed / durationMs);

      // Smooth cubic-out easing (fast start, silky-smooth deceleration)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentRenderTime = fromTimeMs + (toTimeMs - fromTimeMs) * eased;

      this.ctx.clearRect(0, 0, this.width, this.height);
      this.renderBackgroundFX(currentRenderTime);
      this.renderLanes(currentRenderTime);
      this.renderRewindVFX(progress);
      this.renderNotes(currentRenderTime);
      this.renderHitLine();

      if (progress < 1.0) {
        this.animFrameId = requestAnimationFrame(rewindStep);
      } else {
        this.isRewinding = false;
        this.animFrameId = null;
        if (onComplete) onComplete();
      }
    };

    this.animFrameId = requestAnimationFrame(rewindStep);
  }

  reviveAndResume() {
    try {
      this.synth.playAnalogTapeRewind();
    } catch (e) {}

    // 1. Exact fail time and rewind position (-2.0s)
    const failTimeSec = this.lastFailSongTimeSec || ((this.sync.getCurrentTimeMs() || 0) / 1000);
    const failTimeMs = failTimeSec * 1000;
    const fromTimeMs = failTimeMs + this.latencyOffsetMs;

    const rewindTargetSec = Math.max(0, failTimeSec - 2.0);
    const rewindTargetMs = rewindTargetSec * 1000;
    const toTimeMs = rewindTargetMs + this.latencyOffsetMs;

    // 2. Seek audio to rewind target
    this.sync.pause();
    this.sync.seekTo(rewindTargetSec);

    // 3. Clear ALL notes prior to and at the failure point + 1.6s clear runway!
    // Any note with timestamp <= rewindTargetMs + 1600 is cleared so the player has reaction time!
    const clearThresholdMs = Math.max(failTimeMs + 60, rewindTargetMs + 1600);
    for (const note of this.notes) {
      const noteTime = note.timestamp_ms || 0;
      if (noteTime <= clearThresholdMs) {
        note.hit = true;
        note.missed = false;
        note.processed = true;
        note.holding = false;
        note.holdCompleted = true;
      } else {
        note.hit = false;
        note.missed = false;
        note.processed = false;
        note.holding = false;
        note.holdCompleted = false;
      }
    }

    this.firstActiveNoteIndex = 0;
    this.lastLitSyllableIndex = -1;
    if (this.particles) {
      this.particles.reset();
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.judgements = [];
    this.fxRipples = [];
    this.bgBursts = [];

    this.isProcessingMiss = false;
    this.missHighlight = null;
    this.lastMissTimePerf = performance.now();
    // 2.5s invulnerability grace period
    this.invulnerableUntil = failTimeMs + this.latencyOffsetMs + 2500;

    if (this.ui && this.ui.onShowRewindBadge) {
      this.ui.onShowRewindBadge();
    }

    this.isPaused = false;
    this.isGameOver = false;
    this.isCountingDown = false;
    this.initCanvasSize();

    // 4. Start smooth 600ms rewind animation:
    // Notes from failTimeMs onward glide smoothly upwards from hitline to top
    // while all notes prior to failure are completely gone!
    this.animateRewind(fromTimeMs, toTimeMs, 600, () => {
      this.resume();
    });
  }

  restart() {
    if (!this.beatmapData) return;
    this.stop();
    this.loadBeatmap(this.beatmapData, this.currentAudioSource);
  }

  // ⚡ OPTIMIZADO: Pausa vídeo de fondo al detener
  stop() {
    this.isPaused = true;
    this.isRunning = false;
    this.isRewinding = false;
    this.isProcessingMiss = false;
    this.isCountingDown = false;
    this.missHighlight = null;
    if (this.customBgVideo) {
      try { this.customBgVideo.pause(); } catch(e) {}
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.sync.pause();
    if (this.sync.audioElement) {
      try {
        this.sync.audioElement.pause();
        this.sync.audioElement.removeAttribute('src');
        this.sync.audioElement.load();
      } catch (e) {}
    }
    if (this.sync._blobUrl) {
      try {
        URL.revokeObjectURL(this.sync._blobUrl);
      } catch (e) {}
      this.sync._blobUrl = null;
    }
    if (this.sync) {
      this.sync._lastRawAudio = -1;
      this.sync._interpolatedTime = 0;
      this.sync._interpolatedMs = 0;
      this.sync._lastFrameNow = 0;
      this.sync._lastSyncPerf = performance.now();
    }
    this.activeHolds.clear();
    this.activeTouches.clear();
    this.notes.length = 0;
    this.judgements.length = 0;
    this.fxRipples.length = 0;
    this.flyingLyrics.length = 0;
    this.bgBursts.length = 0;
    this.musicalNotes.length = 0;
    if (this._mineExplosions) this._mineExplosions.length = 0;
    if (this._shatteredKeyFragments) this._shatteredKeyFragments.length = 0;
    if (this._mineFloatingPenalties) this._mineFloatingPenalties.length = 0;
    if (this._lyricKeySpriteCache && this._lyricKeySpriteCache.size > 160) {
      this._lyricKeySpriteCache.clear();
    }
    this.firstActiveNoteIndex = 0;
    this.lastLitSyllableIndex = -1;
    this._lastCurLyricIndex = -1;
    if (typeof document !== 'undefined') {
      const curEl = document.getElementById('karaokeCurrentLine');
      if (curEl) curEl.innerHTML = '';
    }
  }

  getCurrentGameTimeMs(frameNow = null) {
    // Si se invoca desde eventos de input (sin frameNow explícito) mientras el bucle VSync está activo,
    // devolver en O(1) el timestamp exacto del fotograma actual sin mutar el estado del reloj de audio.
    if (frameNow === null && this.isRunning && !this.isPaused && Number.isFinite(this._frameGameTimeMs)) {
      return this._frameGameTimeMs;
    }
    const fn = (frameNow !== null && Number.isFinite(frameNow)) ? frameNow : (this._frameNow || performance.now());
    if (this.isCountingDown) {
      const elapsed = fn - this.leadInStartTime;
      return Math.min(0, elapsed - this.leadInDurationMs);
    }
    if (this.isCalibrating) {
      return (fn - this.calibrationStartTime) + this.latencyOffsetMs;
    }
    return this.sync.getCurrentTimeMs(fn) + this.latencyOffsetMs;
  }

  handleTouchStart(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding) return;

    this.lastTouchTime = performance.now();
    const rect = this.canvas.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const lane = this.getLaneFromX(touch.clientX, touch.clientY);

      this.activeTouches.set(touch.identifier, {
        x0: x, y0: y, t0: now, lane, swiped: false
      });

      // Registro de arrastre interactivo para notas de deslizamiento (Swipe)
      this.activeSwipeDrags.set(touch.identifier, {
        lane, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0
      });

      this.triggerLaneInput(lane, 'tap', null, touch.identifier);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (this.isPaused || this.isRewinding) return;

    const rect = this.canvas.getBoundingClientRect();
    const now = performance.now();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      if (!touchData || touchData.swiped) continue;

      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;
      const dx = currentX - touchData.x0;
      const dy = currentY - touchData.y0;

      // Actualizar offset de arrastre en tiempo real (mueve la flecha con el dedo)
      const drag = this.activeSwipeDrags.get(touch.identifier);
      if (drag) {
        drag.dx = dx;
        drag.dy = dy;
      }

      const dist = Math.hypot(dx, dy);
      const elapsed = now - touchData.t0;

      if (dist > 22 && elapsed < 400) {
        let direction = 'up';
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? 'right' : 'left';
        } else {
          direction = dy > 0 ? 'down' : 'up';
        }

        touchData.swiped = true;
        this.activeSwipeDrags.delete(touch.identifier);
        this.triggerLaneInput(touchData.lane, 'swipe', direction, touch.identifier);
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);
      if (touchData) {
        this.releaseLaneHold(touchData.lane, touch.identifier);
        this.activeTouches.delete(touch.identifier);
      }
      this.activeSwipeDrags.delete(touch.identifier);
    }
  }

  handleMouseDown(e) {
    if (this.isPaused || this.isRewinding) return;
    // Evitar eventos de ratón sintéticos duplicados en dispositivos táctiles
    if (performance.now() - (this.lastTouchTime || 0) < 500) return;
    const lane = this.getLaneFromX(e.clientX, e.clientY);
    const rect = this.canvas.getBoundingClientRect();
    this.mouseTouch = {
      x0: e.clientX - rect.left,
      y0: e.clientY - rect.top,
      t0: performance.now(),
      lane: lane,
      swiped: false
    };
    this.triggerLaneInput(lane, 'tap', null, 'mouse');
  }

  handleMouseMove(e) {
    if (!this.mouseTouch || this.mouseTouch.swiped || this.isPaused || this.isRewinding) return;
    const rect = this.canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left) - this.mouseTouch.x0;
    const dy = (e.clientY - rect.top) - this.mouseTouch.y0;
    const dist = Math.hypot(dx, dy);

    if (dist > 20) {
      let direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      this.mouseTouch.swiped = true;
      this.triggerLaneInput(this.mouseTouch.lane, 'swipe', direction, 'mouse');
    }
  }

  handleMouseUp() {
    if (this.mouseTouch) {
      this.releaseLaneHold(this.mouseTouch.lane, 'mouse');
      this.mouseTouch = null;
    }
  }

  /**
   * Mapea coordenadas físicas (clientX, clientY) al carril exacto en perspectiva 3D
   * con asistencia magnética inteligente en los bordes de carril (evita fallos al rozar el carril vecino en 4 carriles).
   */
  resolveTouchLane(clientX, clientY, rect, useMagnetism = true) {
    const nLanes = this.numLanes || 3;
    const w = (rect && rect.width > 0) ? rect.width : (this.width || 360);
    const h = (rect && rect.height > 0) ? rect.height : (this.height || 640);
    const localX = clientX - (rect ? rect.left : 0);
    const localY = clientY - (rect ? rect.top : 0);

    let rawLane = 0;
    let laneFrac = 0.5;

    if (this.visualDimension !== '2d' && typeof this.getLaneBoundaryX === 'function') {
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.82);
      const refY = Math.max(hitY - 95, Math.min(h, Number.isFinite(localY) ? localY : hitY));
      const leftEdge = this.getLaneBoundaryX(0, refY);
      const rightEdge = this.getLaneBoundaryX(nLanes, refY);
      const spanW = Math.max(1, rightEdge - leftEdge);
      const exactPos = ((localX - leftEdge) / spanW) * nLanes;
      rawLane = Math.max(0, Math.min(nLanes - 1, Math.floor(exactPos)));
      laneFrac = Math.max(0, Math.min(1, exactPos - rawLane));
    } else {
      const normX = localX / Math.max(1, w);
      const exactPos = normX * nLanes;
      rawLane = Math.max(0, Math.min(nLanes - 1, Math.floor(exactPos)));
      laneFrac = Math.max(0, Math.min(1, exactPos - rawLane));
    }

    if (!useMagnetism || !this.isRunning || this.isPaused || this.isCalibrating || !Array.isArray(this.notes) || this.notes.length === 0) {
      return rawLane;
    }

    // Margen de asistencia magnética en los bordes del carril (más generoso en modo 4 carriles)
    const borderZone = (nLanes === 4) ? 0.36 : 0.22;
    let candidateNeighbor = -1;
    if (laneFrac < borderZone && rawLane > 0) {
      candidateNeighbor = rawLane - 1;
    } else if (laneFrac > (1.0 - borderZone) && rawLane < nLanes - 1) {
      candidateNeighbor = rawLane + 1;
    }

    if (candidateNeighbor === -1) return rawLane;

    const currentTime = this.getCurrentGameTimeMs(this._frameNow || performance.now());
    const hitWindow = this.isMushroomModeActive ? 300 : 240;
    const startSearchIdx = Math.max(0, (this.firstActiveNoteIndex || 0) - 2);
    const nLen = this.notes.length;

    const hasActiveTargetInLane = (targetL) => {
      if (this.activeHolds && this.activeHolds.has(targetL)) return true;
      for (let i = startSearchIdx; i < nLen; i++) {
        const note = this.notes[i];
        if (!note || note.isMine || note.missed || note.holdCompleted || note.holding) continue;
        if (this.isEchoModeActive && note._isEchoRebound) {
          if (!note._echoBounceLaunched && currentTime < (note._echoSourceTimeMs || 0) + 50) continue;
          if (note._echoBounceLaunched) {
            const lT = note._echoLaunchTimeMs || note._echoSourceTimeMs || 0;
            const uB = (currentTime - lT) / Math.max(180, note.timestamp_ms - lT);
            if (uB < 0.50) continue;
          }
        }
        const reqL = (this.isMirrorModeActive && note._isMirrored && (note.lane === 0 || note.lane === 2))
          ? (2 - note.lane)
          : note.lane;
        if (note.type === 'hold' && note.hit && note.holdReleasedEarly) {
          const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
          if (reqL === targetL && currentTime >= note.timestamp_ms && currentTime < endT - 90) return true;
        }
        if (note.hit) continue;
        if (note.timestamp_ms - currentTime > hitWindow + 60) break;
        if (reqL === targetL && Math.abs(currentTime - note.timestamp_ms) <= hitWindow) {
          return true;
        }
      }
      return false;
    };

    const rawHasNote = hasActiveTargetInLane(rawLane);
    if (rawHasNote) return rawLane;

    const neighborHasNote = hasActiveTargetInLane(candidateNeighbor);
    if (neighborHasNote) {
      return candidateNeighbor;
    }

    return rawLane;
  }

  triggerLaneInput(lane, inputType = 'tap', swipeDirection = null, touchId = null) {
    // En Modo Carretera no existen notas swipe
    if (inputType === 'swipe' && this.isHighwayModeActive) {
      return false;
    }

    const nowInput = performance.now();
    const currentTime = this.getCurrentGameTimeMs(this._frameNow || nowInput);
    const hitY = this.hitLineY;
    const hitX = (this.visualDimension !== '2d' && typeof this.getLaneBoundaryX === 'function')
      ? (this.getLaneBoundaryX(lane, hitY) + this.getLaneBoundaryX(lane + 1, hitY)) * 0.5
      : (lane + 0.5) * this.laneWidth;

    // Si este carril ya tiene un Hold activo y llega un nuevo toque, re-vincular el touchId sin disparar fallo ni borrar el hold
    if (inputType === 'tap' && this.activeHolds.has(lane)) {
      const existingHold = this.activeHolds.get(lane);
      if (existingHold && existingHold.note && !existingHold.note.holdCompleted) {
        existingHold.touchId = touchId;
        this.laneGlows[lane] = 1.0;
        return true;
      }
    }

    const isMushTiming = Boolean(this.isMushroomModeActive);
    const HIT_WINDOW = isMushTiming
      ? ((inputType === 'swipe') ? 370 : 300)
      : ((inputType === 'swipe') ? 320 : 240);

    // 1. Recolectar notas activas en este carril
    const laneNotes = [];
    const nLen = this.notes.length;
    const startSearchIdx = Math.max(0, (this.firstActiveNoteIndex || 0) - 2);
    if (!this._lastLaneHitPerf) this._lastLaneHitPerf = [0, 0, 0, 0];
    const msSinceLastHitInLane = nowInput - (this._lastLaneHitPerf[lane] || 0);

    for (let i = startSearchIdx; i < nLen; i++) {
      const note = this.notes[i];
      if (!note || note.missed || note.holdCompleted || note.holding) continue;
      if (this.isEchoModeActive && note._isEchoRebound) {
        if (!note._echoBounceLaunched && currentTime < (note._echoSourceTimeMs || 0) + 50) continue;
        if (note._echoBounceLaunched) {
          const lT = note._echoLaunchTimeMs || note._echoSourceTimeMs || 0;
          const uB = (currentTime - lT) / Math.max(180, note.timestamp_ms - lT);
          if (uB < 0.50) continue;
        }
      }

      const requiredInputLane = (this.isMirrorModeActive && note._isMirrored && (note.lane === 0 || note.lane === 2))
        ? (2 - note.lane)
        : note.lane;

      // Permitir re-enganchar un hold que fue soltado temprano mientras su cuerpo sigue pasando por la meta
      if (note.type === 'hold' && note.hit && note.holdReleasedEarly && inputType === 'tap') {
        const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
        if (requiredInputLane === lane && currentTime >= note.timestamp_ms && currentTime < endT - 90) {
          note.holding = true;
          note.holdReleasedEarly = false;
          this.activeHolds.set(lane, {
            note: note,
            touchId: touchId,
            startTime: note.timestamp_ms,
            initialTime: note.timestamp_ms,
            color: '#ffe082'
          });
          this.laneGlows[lane] = 1.0;
          if (note.lane !== lane) this.laneGlows[note.lane] = 1.0;
          return true;
        }
      }

      if (note.hit) continue;
      if (note.timestamp_ms - currentTime > HIT_WINDOW + 80) break;
      const matchesLane = this.isCalibrating || requiredInputLane === lane;
      if (!matchesLane) continue;

      // Si es un evento de arrastre swipe, SOLO buscar notas que sean realmente de tipo 'swipe'
      if (inputType === 'swipe' && note.type !== 'swipe') continue;

      const diffFromNote = currentTime - note.timestamp_ms;
      const absDiff = Math.abs(diffFromNote);

      // Evitar que un doble toque involuntario tras acertar una nota robe prematuramente otra nota o un hold que aún viene lejos (>115ms antes)
      if (inputType === 'tap' && msSinceLastHitInLane < 95 && diffFromNote < -115) {
        continue;
      }

      if (absDiff <= HIT_WINDOW) {
        laneNotes.push({ note, absDiff, diff: diffFromNote, time: note.timestamp_ms });
      }
    }

    // ⚡ Si es swipe y no hubo nota swipe en el carril de inicio, buscar nota swipe activa en carriles adyacentes (respetando el carril requerido en modo espejo)
    if (inputType === 'swipe' && laneNotes.length === 0) {
      for (let i = startSearchIdx; i < nLen; i++) {
        const note = this.notes[i];
        if (!note || note.hit || note.missed || note.holdCompleted || note.holding) continue;
        if (note.timestamp_ms - currentTime > HIT_WINDOW + 80) break;
        if (note.type !== 'swipe') continue;
        if (this.isMirrorModeActive && note._isMirrored && (note.lane === 0 || note.lane === 2)) {
          if ((2 - note.lane) !== lane) continue;
        }
        const diffFromNote = currentTime - note.timestamp_ms;
        const absDiff = Math.abs(diffFromNote);
        if (absDiff <= HIT_WINDOW) {
          laneNotes.push({ note, absDiff, diff: diffFromNote, time: note.timestamp_ms });
        }
      }
    }

    // Si fue un movimiento de dedo (swipe) pero no había ninguna nota swipe esperando, ignorar silenciosamente sin penalizar ni tocar otra tecla
    if (inputType === 'swipe' && laneNotes.length === 0) {
      return false;
    }

    if (laneNotes.length > 1) {
      laneNotes.sort((a, b) => a.time - b.time);
    }

    // Si es un tap pero la nota frontal es un SWIPE, no consumir el toque aún: dejar que touchmove valide el deslizamiento
    if (inputType === 'tap' && laneNotes.length > 0 && laneNotes[0].note.type === 'swipe') {
      this.laneGlows[lane] = 0.65;
      return false;
    }

    // Efectos visuales de pulsación de carril
    if (!this.borderEqLeftSurges) this.borderEqLeftSurges = new Float32Array(16);
    if (!this.borderEqRightSurges) this.borderEqRightSurges = new Float32Array(16);
    const rowCount = 12;
    const lastLaneIdx = (this.numLanes || 3) - 1;
    if (lane === 0) {
      this.borderSurgeL = 1.0;
      this.borderSurgeR = Math.max(this.borderSurgeR || 0, 0.35);
      for (let i = 0; i < rowCount; i++) {
        this.borderEqLeftSurges[i] = Math.min(1.0, (this.borderEqLeftSurges[i] || 0) * 0.4 + 0.55 + Math.random() * 0.35);
      }
    } else if (lane === lastLaneIdx) {
      this.borderSurgeR = 1.0;
      this.borderSurgeL = Math.max(this.borderSurgeL || 0, 0.35);
      for (let i = 0; i < rowCount; i++) {
        this.borderEqRightSurges[i] = Math.min(1.0, (this.borderEqRightSurges[i] || 0) * 0.4 + 0.55 + Math.random() * 0.35);
      }
    } else {
      this.borderSurgeL = Math.max(this.borderSurgeL || 0, 0.85);
      this.borderSurgeR = Math.max(this.borderSurgeR || 0, 0.85);
      for (let i = 0; i < rowCount; i++) {
        this.borderEqLeftSurges[i] = Math.min(1.0, (this.borderEqLeftSurges[i] || 0) * 0.4 + 0.48 + Math.random() * 0.30);
        this.borderEqRightSurges[i] = Math.min(1.0, (this.borderEqRightSurges[i] || 0) * 0.4 + 0.48 + Math.random() * 0.30);
      }
    }
    this.laneGlows[lane] = 1.0;
    if (this.laneFlashTimers) this.laneFlashTimers[lane] = 0.28;
    if (this.laneFlashColors) this.laneFlashColors[lane] = this.getJudgeGlowColor('perfectPlus');
    if (this.lanePressAnim) this.lanePressAnim[lane] = nowInput;

    if (!this._laneBurstPalettes) {
      this._laneBurstPalettes = [
        { c1: '#00f2fe', c2: '#3b82f6', alt: '#39ff14' },
        { c1: '#ff007f', c2: '#a855f7', alt: '#ffe600' },
        { c1: '#fbbf24', c2: '#ff3300', alt: '#ff007f' },
        { c1: '#39ff14', c2: '#00f5a0', alt: '#00f2fe' }
      ];
    }
    const p = this._laneBurstPalettes[lane % this._laneBurstPalettes.length];
    const isRiverInput = Boolean(this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive));
    const effect = isRiverInput ? 'river_splash' : this.normalizeEffectId(this.activeEffect);
    if (!isRiverInput) this.activeEffect = effect;

    if (isRiverInput) {
      if (this.laneFlashColors) this.laneFlashColors[lane] = '#00f2fe';
      if (typeof this._emitRiverTapRipple === 'function') {
        this._emitRiverTapRipple(hitX, hitY, 1.0, false);
      }
      if (typeof this._emitRiverSplash === 'function') {
        this._emitRiverSplash(hitX, hitY - 4, 0.95, 11, false);
      }
    }

    if (this.bgBursts.length >= 4) this.bgBursts.shift();
    if (this.fxRipples.length >= 4) this.fxRipples.shift();

    this.bgBursts.push({
      type: effect,
      lane,
      x: hitX,
      y: hitY,
      age: 0,
      duration: 0.55,
      radius: 16,
      maxRadius: Math.max(this.width, this.height) * 0.50,
      alpha: 1.0,
      decay: 1.85,
      seed: Math.random() * 100,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() < 0.5 ? 1 : -1) * 2.8,
      color1: isRiverInput ? '#00f2fe' : p.c1,
      color2: isRiverInput ? '#38bdf8' : p.c2
    });

    this.fxRipples.push({
      lane,
      x: hitX,
      y: hitY,
      radius: 10,
      maxRadius: Math.max(58, (this.laneWidth || 100) * (isRiverInput ? 0.88 : 0.72)),
      alpha: 0.92,
      decay: isRiverInput ? 2.6 : 3.4,
      color: isRiverInput ? '#7dd3fc' : p.c1
    });

    const isActivelyPlaying = (this.isRunning || (this.sync && this.sync.isPlaying)) && !this.isPaused && !this.isGameOver && !this.isCountingDown && !this.isCalibrating && !!this.beatmapData;
    const isProtectedTransition = Boolean(this.isMushroomModeActive && this._mushInSafeTransition);

    if (laneNotes.length === 0) {
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, this.getScoreColor('perfectPlus'));
      }
      if (this.isCalibrating || isProtectedTransition) {
        this.emitKeyHit(hitX, hitY, this.getScoreColor('perfectPlus'), 18);
        return true;
      }
      if (isActivelyPlaying && !this.isProcessingMiss) {
        this.synth.playPunchyArcadeMiss();
        this.addJudgement('MISS', '#a81b26', lane);
        this.missHighlight = {
          type: 'empty_tap',
          lane: lane,
          x: hitX,
          y: hitY,
          time: nowInput
        };
        this.handleMiss();
        return true;
      }
      return true;
    }

    const frontEntry = laneNotes[0];
    const frontNote = frontEntry.note;
    const isFlippedMush = Boolean(isMushTiming && (this._mushFlipProgress || 0) > 0.5);
    let closestNote = null;
    let minDiff = Infinity;

    if (inputType === 'tap') {
      closestNote = frontNote;
      minDiff = frontEntry.absDiff;
    } else if (inputType === 'swipe') {
      const rawTargetDir = (frontNote.direction || 'up').toLowerCase();
      const isMirroredSwipe = Boolean(this.isMirrorModeActive && frontNote._isMirrored && (frontNote.lane === 0 || frontNote.lane === 2));
      const targetDir = isMirroredSwipe
        ? (rawTargetDir === 'left' ? 'right' : (rawTargetDir === 'right' ? 'left' : rawTargetDir))
        : rawTargetDir;
      const curDir = (swipeDirection || '').toLowerCase();
      const flippedTargetDir = isFlippedMush
        ? (targetDir === 'up' ? 'down' : (targetDir === 'down' ? 'up' : targetDir))
        : targetDir;
      if (!curDir || !targetDir || curDir === targetDir || curDir === flippedTargetDir) {
        closestNote = frontNote;
        minDiff = frontEntry.absDiff;
      } else {
        return false;
      }
    }

    if (!closestNote) {
      return false;
    }

    this._lastLaneHitPerf[lane] = nowInput;
    if (closestNote.lane !== undefined) {
      this._lastLaneHitPerf[closestNote.lane] = nowInput;
    }
    // En Modo Espejo (OJEPSƎ): si se acertó una tecla reflejada (pulsando el carril opuesto),
    // iluminar también el carril visual de la nota y disparar un haz láser de reflexión cruzada
    if (this.isMirrorModeActive && closestNote._isMirrored && closestNote.lane !== lane) {
      const visLane = closestNote.lane;
      this.laneGlows[visLane] = 1.0;
      if (this.laneFlashTimers) this.laneFlashTimers[visLane] = 0.30;
      if (this.laneFlashColors) this.laneFlashColors[visLane] = '#e879f9';
      if (this.lanePressAnim) this.lanePressAnim[visLane] = nowInput;
      const visHitX = (this.visualDimension !== '2d' && typeof this.getLaneBoundaryX === 'function')
        ? (this.getLaneBoundaryX(visLane, hitY) + this.getLaneBoundaryX(visLane + 1, hitY)) * 0.5
        : (visLane + 0.5) * this.laneWidth;
      if (!this._mirrorCrossBeams) this._mirrorCrossBeams = [];
      this._mirrorCrossBeams.push({
        fromX: hitX,
        toX: visHitX,
        y: hitY,
        age: 0,
        duration: 0.38
      });
      this.emitKeyHit(visHitX, hitY, '#38bdf8', 20);
    }

    if (this.isCalibrating) {
      closestNote.hit = true;
      const jCalib = this.judgeHit(closestNote, minDiff, hitX, hitY);
      this.emitKeyHit(hitX, hitY, jCalib.color, 24);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, jCalib.color);
      }
      return true;
    }

    if (closestNote.isMine) {
      this.triggerMineExplosion(closestNote, hitX, hitY, currentTime);
      return true;
    }

    if (closestNote.type === 'tap' || (!closestNote.type || closestNote.type === 'single' || closestNote.type === 'normal')) {
      closestNote.hit = true;
      if (this.isEchoModeActive) {
        if (closestNote._isEchoSource && closestNote._echoTargetNote) {
          this._launchEchoRebound(closestNote, currentTime, hitX, hitY, false);
        } else if (closestNote._isEchoRebound) {
          this._triggerEchoReboundHitFX(closestNote, hitX, hitY);
        }
      }
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      } catch (eTap) {
        console.error('[Engine] Error en judgeHit tap:', eTap);
        j = { text: 'PERFECT', color: '#ffd700', points: 80 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 22);
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
      return true;
    } else if (closestNote.type === 'swipe') {
      const rawTargetDir = (closestNote.direction || 'up').toLowerCase();
      const isMirroredSwipe = Boolean(this.isMirrorModeActive && closestNote._isMirrored && (closestNote.lane === 0 || closestNote.lane === 2));
      const targetDir = isMirroredSwipe
        ? (rawTargetDir === 'left' ? 'right' : (rawTargetDir === 'right' ? 'left' : rawTargetDir))
        : rawTargetDir;
      const curDir = (swipeDirection || '').toLowerCase();
      const flippedTargetDir = isFlippedMush
        ? (targetDir === 'up' ? 'down' : (targetDir === 'down' ? 'up' : targetDir))
        : targetDir;
      const isExactSwipe = inputType === 'swipe' && (!curDir || !closestNote.direction || curDir === targetDir || curDir === flippedTargetDir);

      if (!isExactSwipe) {
        return false;
      }

      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY, 'SWIPE');
      } catch (eSwipe) {
        console.error('[Engine] Error en judgeHit swipe:', eSwipe);
        j = { text: 'SWIPE', color: '#ffd700', points: 100 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 26);

      if (!this.activeSwipeLaunches) this.activeSwipeLaunches = [];
      const launchVx = targetDir === 'left' ? -1550 : (targetDir === 'right' ? 1550 : 0);
      const launchVy = targetDir === 'up' ? -1650 : (targetDir === 'down' ? 1450 : 0);
      const launchRot = targetDir === 'left' ? -0.45 : (targetDir === 'right' ? 0.45 : (targetDir === 'down' ? 0.2 : -0.2));

      this.activeSwipeLaunches.push({
        lane: closestNote.lane,
        x: hitX,
        y: hitY,
        dir: targetDir,
        color: j.color || '#00f2fe',
        startTime: nowInput,
        duration: 420,
        vx: launchVx,
        vy: launchVy,
        rot: launchRot
      });

      if (this.particles && typeof this.particles.emitSwipeBurst === 'function') {
        this.particles.emitSwipeBurst(hitX, hitY, targetDir, j.color, 36);
      }
      if (this.customBgMode === 'reactive') {
        this.addReactiveBurst(lane, hitX, hitY, j.color);
      }
      return true;
    } else if (closestNote.type === 'hold') {
      const rawDur = closestNote.duration_ms || 0;
      if (rawDur <= 220) {
        closestNote.hit = true;
        closestNote.holdCompleted = true;
        let j;
        try {
          j = this.judgeHit(closestNote, minDiff, hitX, hitY);
        } catch (eHold) {
          j = { text: 'PERFECT', color: '#ffd700', points: 80 };
        }
        this.emitKeyHit(hitX, hitY, j.color, 22);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
        return true;
      } else {
        const prevHold = this.activeHolds.get(lane);
        if (prevHold && prevHold.note && prevHold.note !== closestNote) {
          prevHold.note.holding = false;
          prevHold.note.holdCompleted = true;
          prevHold.note.hit = true;
        }
        closestNote.hit = true;
        closestNote.holding = true;
        closestNote.missed = false;
        closestNote.holdReleasedEarly = false;
        let j;
        try {
          j = this.judgeHit(closestNote, minDiff, hitX, hitY);
        } catch (eHold2) {
          j = { text: 'PERFECT', color: '#ffd700', points: 80 };
        }
        this.activeHolds.set(lane, {
          note: closestNote,
          touchId: touchId,
          startTime: currentTime,
          initialTime: closestNote.timestamp_ms,
          color: j.color
        });
        this.emitKeyHit(hitX, hitY, j.color, 20);
        if (this.customBgMode === 'reactive') {
          this.addReactiveBurst(lane, hitX, hitY, j.color);
        }
        return true;
      }
    } else {
      closestNote.hit = true;
      let j;
      try {
        j = this.judgeHit(closestNote, minDiff, hitX, hitY);
      } catch (eDef) {
        j = { text: 'GOOD', color: '#9e7b66', points: 25 };
      }
      this.emitKeyHit(hitX, hitY, j.color, 20);
      return true;
    }
  }

  releaseLaneHold(lane, touchId = null) {
    const active = this.activeHolds.get(lane);
    if (!active) return;
    if (touchId !== null && active.touchId !== null && active.touchId !== touchId) return;

    const currentTime = this.getCurrentGameTimeMs();
    const note = active.note;
    const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
    const heldDuration = currentTime - active.startTime;
    const totalDuration = endT - active.startTime;

    const isSafeHold = Boolean(this.isMushroomModeActive && this._mushInSafeTransition);

    // Acierto completado con bonus si se mantuvo al menos el 50% o hasta 220ms del final
    if (isSafeHold || currentTime >= endT - 220 || (totalDuration > 0 && (heldDuration / totalDuration) >= 0.50)) {
      note.holdCompleted = true;
      note.hit = true;
      note.holding = false;
      note.holdReleasedEarly = false;
      this.addScore(450 * this.multiplier);
      if (this.ui && this.ui.onHitBeatPulse) {
        this.ui.onHitBeatPulse(this.combo);
      }
      const hitX = (lane + 0.5) * this.laneWidth;
      const holdColor = (active.color && active.color !== '#00ff88' && active.color !== '#00f2fe') ? active.color : '#e5b869';
      this.emitKeyHit(hitX, this.hitLineY, holdColor, 30);
    } else {
      // Si se suelta antes, NO borrar el hold de la pantalla ni romper la partida por micro-cortes táctiles:
      // la cabeza ya fue juzgada al tocarla y el cuerpo del hold sigue pasando visualmente (pudiendo re-engancharse)
      note.hit = true;
      note.holding = false;
      note.holdReleasedEarly = true;
    }
    this.activeHolds.delete(lane);
  }

  judgeHit(note, diffMs, x, y, customLabel = null) {
    let text = 'GREAT';
    let color = this.getScoreColor('great');
    let points = 150;
    let flashDuration = 0.18;
    let flashColor = '#ffd700';
    let judgeTier = 'great';

    const isMushJudge = Boolean(this.isMushroomModeActive);
    const perfPlusMax = isMushJudge ? 85 : 45;
    const perfMax = isMushJudge ? 155 : 90;
    const greatMax = isMushJudge ? 235 : 170;

    if (diffMs <= perfPlusMax) {
      text = customLabel ? `PERFECT+ ${customLabel}` : 'PERFECT+';
      color = this.getScoreColor('perfectPlus');
      flashColor = this.getJudgeGlowColor('perfectPlus');
      flashDuration = 0.34;
      points = 450;
      this.stats.perfectPlus++;
      this.streakCount++;
      judgeTier = 'perfectPlus';
    } else if (diffMs <= perfMax) {
      text = customLabel ? `PERFECT ${customLabel}` : 'PERFECT';
      color = this.getScoreColor('perfect');
      flashColor = this.getJudgeGlowColor('perfect');
      flashDuration = 0.30;
      points = 300;
      this.stats.perfect++;
      this.streakCount++;
      judgeTier = 'perfect';
    } else if (diffMs <= greatMax) {
      text = customLabel ? `GREAT ${customLabel}` : 'GREAT';
      color = this.getScoreColor('great');
      flashColor = this.getJudgeGlowColor('great');
      flashDuration = 0.26;
      points = 150;
      this.stats.great++;
      this.streakCount = Math.max(0, this.streakCount - 1);
      judgeTier = 'great';
    } else {
      text = customLabel ? `GOOD ${customLabel}` : 'GOOD';
      color = this.getScoreColor('good');
      flashColor = this.getJudgeGlowColor('good');
      flashDuration = 0.22;
      points = 75;
      this.stats.good = (this.stats.good || 0) + 1;
      this.streakCount = 0;
      judgeTier = 'good';
    }

    // Telemetría de precisión sub-milisegundo (Early < 0 / Late > 0, 0 allocs)
    if (note) {
      if (!this.timingStats) {
        this.timingStats = { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
      }
      const noteT = Number.isFinite(note.timestamp_ms) ? note.timestamp_ms : (Number.isFinite(note.timeMs) ? note.timeMs : 0);
      const curT = this.getCurrentGameTimeMs(this._frameNow);
      const signedDiff = Math.max(-180, Math.min(180, curT - noteT));
      this.timingStats.count++;
      this.timingStats.sumSignedMs += signedDiff;
      this.timingStats.sumAbsMs += Math.abs(signedDiff);
      if (signedDiff < -15) this.timingStats.earlyCount++;
      else if (signedDiff > 15) this.timingStats.lateCount++;
      else this.timingStats.exactCount++;

      if (this.ui && typeof this.ui.onTimingOffset === 'function') {
        this.ui.onTimingOffset(signedDiff, judgeTier);
      }
    }

    if (typeof window !== 'undefined' && window.isKaraokeModeActive) {
      const nTime = (note && Number.isFinite(note.sylTime))
        ? note.sylTime
        : (note ? (Number.isFinite(note.timestamp_ms) ? note.timestamp_ms : (Number.isFinite(note.timeMs) ? note.timeMs : Math.round((note.time || 0) * 1000))) : null);

      if (nTime !== null) {
        if (typeof iluminarSilaba === 'function') {
          iluminarSilaba(nTime);
        } else if (typeof window.iluminarSilaba === 'function') {
          window.iluminarSilaba(nTime);
        }
      }
    }

    const noteLane = (note && typeof note.lane === 'number') ? note.lane : 1;

    // Resplandor difuminado de carril con el color exacto del juicio (PERFECT+, PERFECT, GREAT, GOOD)
    this.laneFlashTimers[noteLane] = flashDuration;
    this.laneFlashColors[noteLane] = flashColor;
    this.laneGlows[noteLane] = 1.0;
    this.lastHitTimePerf = performance.now();

    const prevMult = this.multiplier || 1;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Beat Pulse dinámico en cada acierto
    if (this.ui && this.ui.onHitBeatPulse) {
      this.ui.onHitBeatPulse(this.combo);
    }

    // Umbrales de Multiplicador:
    // x2 -> Combo 10 | x3 -> Combo 25 | x4 -> Combo 50 | x5 -> Combo 100
    if (this.combo >= 100) {
      this.multiplier = 5;
    } else if (this.combo >= 50) {
      this.multiplier = 4;
    } else if (this.combo >= 25) {
      this.multiplier = 3;
    } else if (this.combo >= 10) {
      this.multiplier = 2;
    } else {
      this.multiplier = 1;
    }

    if (this.multiplier > prevMult) {
      const midX = this.width / 2;
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      this.addRipple(midX, hitY, '#ffd700', 320);

      // Explosión 3D cinemática luminosa sin oscurecer jamás la pantalla
      if (this.multiplier === 2) {
        this.triggerComboExplosion('2X MULTI', '¡BOOST ÁMBAR!', '#ffd700', '#ffd700', 1.2);
      } else if (this.multiplier === 3) {
        this.triggerComboExplosion('3X FIEBRE', '¡MAGENTA NEÓN!', '#ff007f', '#ff007f', 1.4);
      } else if (this.multiplier === 4) {
        this.triggerComboExplosion('4X HIPER', '¡CIAN ELÉCTRICO!', '#00f2fe', '#00f2fe', 1.6);
      } else if (this.multiplier >= 5) {
        this.triggerComboExplosion('5X DIAMANTE', '¡APOTEOSIS TOTAL!', '#ffffff', '#ffffff', 2.0);
      }
    } else {
      this.checkComboMilestone(this.combo);
    }

    if (diffMs <= 90) {
      this.spawnMusicalNotes(x, y, color, diffMs <= 45 ? 2 : 1);
    }
    
    this.addScore(points * this.multiplier);
    if (text && String(text).trim().length > 0) {
      this.addJudgement(text, color, noteLane);
    }
    return { text, color, points };
  }

  // Nueva Explosión 3D Cinemática y Transformación de Color de Fondo
  triggerComboExplosion(title, subtext = '', color = '#ffd700', targetAtmosphereColor = '#ffd700', intensity = 1.0) {
    const w = this.width || 360;
    const h = this.height || 640;
    const midX = w / 2;
    const midY = h * 0.42;

    // Actualizar paleta activa de la atmósfera con resplandor aditivo luminoso
    this.targetAtmosphereColor = color || targetAtmosphereColor;
    this.atmosphereShiftProgress = 0.0;

    // Crear partículas en perspectiva 3D (optimizado para 120 FPS móviles)
    const sparks = [];
    const sparkCount = Math.min(12, Math.round(10 * Math.min(1.5, intensity)));
    const pal = [color, '#ffffff', '#fff5cc', '#ffe082', '#00f2fe', '#ff007f'];

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (90 + Math.random() * 240) * intensity;
      const zSpeed = (-120 + Math.random() * 320) * intensity;
      sparks.push({
        x: midX + (Math.random() - 0.5) * 36,
        y: midY + (Math.random() - 0.5) * 26,
        z: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: zSpeed,
        radius: (2.0 + Math.random() * 3.0) * intensity,
        color: pal[Math.floor(Math.random() * pal.length)],
        alpha: 1.0,
        decay: 1.8 + Math.random() * 1.4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }

    // Rayos de luz volumétricos rotatorios (optimizado: 6 rayos suaves)
    const rays = [];
    const rayCount = 6;
    for (let i = 0; i < rayCount; i++) {
      const baseAngle = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      rays.push({
        angle: baseAngle,
        length: Math.hypot(w, h) * (0.75 + Math.random() * 0.4),
        width: 16 + Math.random() * 20,
        color: i % 2 === 0 ? color : '#ffffff'
      });
    }

    const explosion = {
      title,
      subtext,
      color: color || '#ffd700',
      targetAtmosphereColor: color || targetAtmosphereColor,
      originX: midX,
      originY: midY,
      radius: 0,
      maxRadius: Math.hypot(w, h) * 1.35,
      age: 0,
      duration: 1.8,
      alpha: 1.0,
      scale: 1.7,
      intensity: intensity || 1.0,
      sparks,
      rays,
      rotation: 0
    };

    if (this.combo3DExplosions.length >= 2) this.combo3DExplosions.shift();
    this.combo3DExplosions.push(explosion);

    this.topComboToast = explosion; // Retrocompatibilidad para HUD listeners
    this.triggerScreenShake(3.8 * intensity, 90);

    if (this.ui && typeof this.ui.onComboMilestone === 'function') {
      this.ui.onComboMilestone(title, subtext, color);
    }
  }

  showTopMilestone(title, subtext = '', color = '#ffd700', duration = 1.2) {
    this.triggerComboExplosion(title, subtext, color, color, 1.0);
  }

  checkComboMilestone(c) {
    const milestones = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
    if (milestones.includes(c)) {
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      this.addRipple(this.width / 2, hitY, '#ffd700', 260);

      let sub = '¡COMBO RACHA!';
      let col = '#ffd700';
      let intens = 1.0;

      if (c >= 300) {
        sub = '¡LEGENDARIO!';
        col = '#ffffff';
        intens = 1.8;
      } else if (c >= 200) {
        sub = '¡SUPERNOVA!';
        col = '#00f2fe';
        intens = 1.6;
      } else if (c >= 100) {
        sub = '¡FIEBRE TOTAL!';
        col = '#ff007f';
        intens = 1.4;
      } else if (c >= 50) {
        sub = '¡EN LLAMAS!';
        col = '#ffaa00';
        intens = 1.2;
      }

      this.triggerComboExplosion(`${c} COMBO`, sub, col, col, intens);
    }
  }

  addRipple(x, y, color = '#ffd700', maxRadius = 240) {
    const w = this.width || 360;
    const lane = Math.max(0, Math.min(2, Math.floor((x / Math.max(1, w)) * 3)));
    if (this.fxRipples.length >= 6) this.fxRipples.shift();
    this.fxRipples.push({
      lane,
      x: x,
      y: y,
      radius: 14,
      maxRadius: maxRadius,
      alpha: 0.90,
      decay: 2.2,
      color: color || '#ffd700'
    });
  }

  triggerGameOver() {
    this.triggerGameEnd();
  }

  spawnMusicalNotes(x, y, color = '#ffd700', count = 2) {
    if (this.musicalNotes.length > 8) {
      this.musicalNotes.splice(0, this.musicalNotes.length - 8);
    }
    const symbols = ['𝄞', '𝅘𝅥𝅯', '♬', '♩', '𝅘𝅥𝅮', '♪'];
    const safeCount = Math.min(count, 2);
    for (let i = 0; i < safeCount; i++) {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = 75 + Math.random() * 95;
      this.musicalNotes.push({
        symbol: sym,
        x: x + (Math.random() - 0.5) * 36,
        y: y - 12 + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed * 0.45,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        decay: 1.1 + Math.random() * 0.8,
        color: color,
        scale: 0.9 + Math.random() * 0.45,
        rotation: (Math.random() - 0.5) * 0.35,
        rotSpeed: (Math.random() - 0.5) * 1.2
      });
    }
  }

  addScore(pts) {
    this.score += pts;
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

    const totalNotes = (this.notes && this.notes.length) || 0;

    // Asignación progresiva de estrellas (0 a 5) según la puntuación acumulada sobre maxPossibleScore:
    // 1★: >= 20% | 2★: >= 40% | 3★: >= 60% | 4★: >= 75% | 5★: >= 90%
    let stars = 0;
    if (scorePct >= 90.0) stars = 5;
    else if (scorePct >= 75.0) stars = 4;
    else if (scorePct >= 60.0) stars = 3;
    else if (scorePct >= 40.0) stars = 2;
    else if (scorePct >= 20.0) stars = 1;
    // Las estrellas nunca disminuyen durante la partida
    const prevStars = this.lastCelebratedStar || 0;
    this.stars = Math.max(this.stars, stars);

    // Celebración de Estrella Desbloqueada:
    // 1. Shockwave circular en nodo de la estrella
    // 2. 8 chispas en caída parabólica aditiva
    // 3. Camera micro-shake de 2px durante 40ms
    if (this.stars > prevStars) {
      for (let s = prevStars + 1; s <= this.stars; s++) {
        if (this.ui && this.ui.onStarUnlocked) {
          this.ui.onStarUnlocked(s, s === 5);
        }
        if (this.particles && this.particles.emitStarCelebration) {
          const cutPct = (s === 1 ? 0.20 : s === 2 ? 0.40 : s === 3 ? 0.60 : s === 4 ? 0.75 : 0.90);
          const starX = (this.width / 2) - 80 + (cutPct * 160);
          const starY = 32;
          this.particles.emitStarCelebration(starX, starY, s === 5);
        }
        this.triggerScreenShake(2.0, 40);
      }
      this.lastCelebratedStar = this.stars;
    }

    // Medallas en tiempo real: Requiere un mínimo de 100 notas en la pista
    // Plata: >= 92% | Oro: >= 94% | Platino: >= 96%
    let medalTier = null;
    if (totalNotes >= 100) {
      if (scorePct >= 96.0) medalTier = 'platinum';
      else if (scorePct >= 94.0) medalTier = 'gold';
      else if (scorePct >= 92.0) medalTier = 'silver';
    }
    // La medalla alcanzada nunca disminuye durante la partida
    if (this.currentMedalTier === 'platinum') medalTier = 'platinum';
    else if (this.currentMedalTier === 'gold' && medalTier !== 'platinum') medalTier = 'gold';
    else if (this.currentMedalTier === 'silver' && !medalTier) medalTier = 'silver';
    this.currentMedalTier = medalTier;

    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    const nowPerf = this._frameNow || performance.now();
    const stateChanged = (this.stars !== prevStars) || (this._lastUiMult !== this.multiplier) || (this._lastUiCombo !== this.combo) || (this._lastUiMedal !== this.currentMedalTier);
    if (stateChanged || !this._lastUiScoreTime || (nowPerf - this._lastUiScoreTime >= 50)) {
      this._lastUiScoreTime = nowPerf;
      this._lastUiMult = this.multiplier;
      this._lastUiCombo = this.combo;
      this._lastUiMedal = this.currentMedalTier;
      if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
        this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
      }
    }
  }

  handleMiss() {
    if (this.isMushroomModeActive && this._mushInSafeTransition) {
      return;
    }
    if (this.isProcessingMiss || this.isGameOver || this.isPaused) {
      console.warn('[MISS] Blocked: processing=' + this.isProcessingMiss + ' gameOver=' + this.isGameOver + ' paused=' + this.isPaused);
      return;
    }

    this.isProcessingMiss = true;
    this.lastMissTimePerf = performance.now();
    this.lastFailSongTimeSec = (this.sync.getCurrentTimeMs() || 0) / 1000;

    this.combo = 0;
    this.streakCount = 0;
    this.multiplier = 1;
    this.stats.miss++;
    
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, (this.score / maxScore) * 100);

    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    // Haptic & visual feedback on miss
    this.triggerScreenShake(4.5, 80);
    this.vignetteAlpha = 0.55;
    this.vignetteColor = '#ff1133';

    // Iluminar el carril de fallo en rojo intenso durante el segundo de gracia
    const failLane = (this.missHighlight && typeof this.missHighlight.lane === 'number') ? this.missHighlight.lane : 1;
    this.laneFlashColors[failLane] = '#ff0033';
    this.laneFlashTimers[failLane] = 1.1;
    this.laneGlows[failLane] = 1.0;

    // Al fallar, las estrellas y medallas alcanzadas no disminuyen
    if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
      this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, this.currentMedalTier, scorePct, accuracyPct);
    }

    // SIEMPRE pausar y mostrar pantalla de muerte si hay notas cargadas
    const hasActiveGame = this.notes && this.notes.length > 0;
    if (hasActiveGame) {
      const penaltyCost = Math.pow(2, this.missCount);
      this.missCount++;
      console.log('[MISS] Delaying death screen 1s to display miss reason. penaltyCost=' + penaltyCost + ' missCount=' + this.missCount + ' score=' + this.score);
      
      // Detener audio inmediatamente para congelar la música
      if (this.sync && this.sync.pause) {
        try { this.sync.pause(); } catch(e) {}
      }

      // Dejar exactamente 1.0s (1000ms) para que el jugador vea en la pista DÓNDE ha fallado
      setTimeout(() => {
        this.pause();
        try {
          if (this.ui && typeof this.ui.onMissPenalty === 'function') {
            this.ui.onMissPenalty(penaltyCost, this.missCount, this.score);
            console.log('[MISS] onMissPenalty callback executed successfully');
          } else {
            console.error('[MISS] onMissPenalty callback NOT available! ui=' + !!this.ui);
            this.isProcessingMiss = false;
          }
        } catch (err) {
          console.error('[MISS] Error in onMissPenalty:', err);
          this.isProcessingMiss = false;
        }
      }, 1000);
    } else {
      console.warn('[MISS] No active game, resetting after 750ms');
      setTimeout(() => {
        this.isProcessingMiss = false;
      }, 750);
    }
  }

  /**
   * Juicio Pop-Up Dinámico sobre el carril impactado:
   * Nace con escala 1.45, se comprime a 1.0 en 90ms (compresión elástica visual),
   * y flota 15px hacia arriba mientras decae suavemente.
   */
  addJudgement(text, color, lane = null) {
    if (!text || !String(text).trim().length) return;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const isFlippedMush = Boolean(
      (this.isMushroomModeActive || (typeof window !== 'undefined' && window.isMushroomModeActive)) &&
      (this._mushFlipProgress || 0) > 0.5
    );
    const startY = isFlippedMush ? ((this.height || 640) * 0.20 + 18) : (hitY - 24);
    let posX = this.width / 2;
    if (lane !== null && lane >= 0 && lane <= 2) {
      if (this.visualDimension !== '2d') {
        const refY = isFlippedMush ? (hitY - 24) : startY;
        const xL = this.getLaneBoundaryX(lane, refY);
        const xR = this.getLaneBoundaryX(lane + 1, refY);
        posX = (xL + xR) / 2;
      } else {
        posX = (lane + 0.5) * (this.width / 3);
      }
    }
    this.judgements.push({
      text: text,
      color: color || '#fff5db',
      x: posX,
      y: startY,
      baseY: startY,
      alpha: 1.0,
      scale: 1.45,
      age: 0
    });
  }

  getKaraokeWordAtTime(curTimeMs, note = null) {
    if (!this.activeKaraokeLyrics || !this.activeKaraokeLyrics.length) return null;
    for (let i = 0; i < this.activeKaraokeLyrics.length; i++) {
      const l = this.activeKaraokeLyrics[i];
      const nextL = this.activeKaraokeLyrics[i + 1];
      const endMs = nextL ? nextL.timeMs : (l.timeMs + 5000);
      if (curTimeMs >= (l.timeMs - 250) && curTimeMs < endMs) {
        if (l.words && l.words.length > 0) {
          const ratio = Math.max(0, Math.min(1, (curTimeMs - l.timeMs) / Math.max(1, endMs - l.timeMs)));
          const wordIdx = Math.min(l.words.length - 1, Math.floor(ratio * l.words.length));
          return l.words[wordIdx];
        }
        return l.text;
      }
    }
    return null;
  }

  splitWordSyllables(rawWord) {
    const word = String(rawWord || '').trim();
    if (!word) return [];
    const clean = word.replace(/^[^\wáéíóúüñÁÉÍÓÚÜÑ]+|[^\wáéíóúüñÁÉÍÓÚÜÑ]+$/gi, '').toUpperCase();
    if (clean.length <= 2) return [clean || word.toUpperCase()];

    const isVowel = c => /[AEIOUÁÉÍÓÚÜ]/.test(c);
    const isStrong = c => /[AEOÁÉÍÓÚ]/.test(c);

    const syllables = [];
    let currentSyl = '';
    const letters = clean.split('');
    let i = 0;

    while (i < letters.length) {
      currentSyl += letters[i];
      if (i < letters.length - 1 && isVowel(letters[i])) {
        const nextChar = letters[i + 1];
        const afterNext = letters[i + 2];
        const after2 = letters[i + 3];

        if (isVowel(nextChar)) {
          if (isStrong(letters[i]) && isStrong(nextChar)) {
            syllables.push(currentSyl + '-');
            currentSyl = '';
          }
        } else if (!isVowel(nextChar)) {
          if (!afterNext) {
          } else if (isVowel(afterNext)) {
            syllables.push(currentSyl + '-');
            currentSyl = '';
          } else {
            const pair = nextChar + afterNext;
            const inseparable = /^(CH|LL|RR|QU|GU|BL|BR|CL|CR|DR|FL|FR|GL|GR|PL|PR|TR)$/.test(pair);
            if (after2 && isVowel(after2) && inseparable) {
              syllables.push(currentSyl + '-');
              currentSyl = '';
            } else if (afterNext && !after2) {
            } else if (after2 && !isVowel(after2)) {
              currentSyl += nextChar;
              i++;
              syllables.push(currentSyl + '-');
              currentSyl = '';
            } else {
              currentSyl += nextChar;
              i++;
              syllables.push(currentSyl + '-');
              currentSyl = '';
            }
          }
        }
      }
      i++;
    }
    if (currentSyl) syllables.push(currentSyl);
    if (syllables.length > 0) {
      syllables[syllables.length - 1] = syllables[syllables.length - 1].replace(/-+$/, '');
    }
    return syllables.length > 0 ? syllables : [clean];
  }

  distributeKaraokeLyrics(targetNotes, lrcLines) {
    if (!targetNotes || !Array.isArray(targetNotes) || !lrcLines || !Array.isArray(lrcLines) || lrcLines.length === 0) return;

    // Si las notas ya tienen letras y asignaciones válidas (ej. UltraStar con sílabas integradas), no sobreescribir
    const alreadyMapped = targetNotes.some(n => n.lineIdx !== null && n.lineIdx !== undefined && n.lyric && !['♪', '♫', '▲', '~', '-'].includes(String(n.lyric).trim()));
    if (alreadyMapped) {
      return;
    }

    // 1. Limpiar asignaciones previas
    for (let i = 0; i < targetNotes.length; i++) {
      targetNotes[i].lyric = null;
      targetNotes[i].wordIdx = null;
      targetNotes[i].lineIdx = null;
    }

    // 2. Ordenar notas cronológicamente
    targetNotes.sort((a, b) => {
      const tA = Number.isFinite(a.timestamp_ms) ? a.timestamp_ms : (a.timeMs || 0);
      const tB = Number.isFinite(b.timestamp_ms) ? b.timestamp_ms : (b.timeMs || 0);
      return tA - tB;
    });

    const firstLrcTime = lrcLines[0].timeMs;

    // 3. Agrupar notas simultáneas en eventos melódicos ÚNICAMENTE si no son instrumentales
    const rhythmicEvents = [];
    let currentEvent = null;
    for (let i = 0; i < targetNotes.length; i++) {
      const n = targetNotes[i];
      const t = Number.isFinite(n.timestamp_ms) ? n.timestamp_ms : (n.timeMs || 0);

      // BLINDAJE INSTRUMENTAL:
      // Notas marcadas explícitamente como instrumentales o muy anteriores al canto (< firstLrcTime - 1200ms)
      // permanecen 100% instrumentales sin letra.
      const isExplicitInst = Boolean(n.isInstrumental || n.is_instrumental || n.isInst);
      if (isExplicitInst || t < (firstLrcTime - 1200)) {
        continue;
      }

      if (!currentEvent || Math.abs(t - currentEvent.timeMs) > 45) {
        currentEvent = { timeMs: t, notes: [n] };
        rhythmicEvents.push(currentEvent);
      } else {
        currentEvent.notes.push(n);
      }
    }

    let lastAssignedEventIdx = -1;

    // 4. Asignación secuencial musical garantizada SÍLABA A SÍLABA (1 nota = 1 sílaba cantada)
    for (let lIdx = 0; lIdx < lrcLines.length; lIdx++) {
      const line = lrcLines[lIdx];
      const nextLine = lrcLines[lIdx + 1];
      const lineStart = line.timeMs;
      const rawWords = (line.words || (line.text ? line.text.split(/\s+/).filter(Boolean) : []))
        .map(w => String(w).toUpperCase().trim())
        .filter(Boolean);
      if (!rawWords.length) continue;

      line.words = rawWords;
      line.wordTimestamps = [];

      // Descomponer las palabras de la línea en sílabas cantadas exactas
      const lineSyllables = [];
      rawWords.forEach((wText, wIdx) => {
        const syls = this.splitWordSyllables(wText);
        syls.forEach((sText, sIdx) => {
          lineSyllables.push({
            text: sText,
            wordIdx: wIdx,
            isFirstOfWord: sIdx === 0,
            isLastOfWord: sIdx === syls.length - 1,
            fullWord: wText
          });
        });
      });

      let startSearchTime;
      if (lIdx === 0) {
        startSearchTime = (rhythmicEvents.length > 0) ? rhythmicEvents[0].timeMs - 100 : lineStart - 1200;
      } else {
        const minT = (lastAssignedEventIdx >= 0 && lastAssignedEventIdx < rhythmicEvents.length)
          ? rhythmicEvents[lastAssignedEventIdx].timeMs + 80
          : 0;
        startSearchTime = Math.max(minT, lineStart - 800);
      }

      const maxDur = Math.max(1200, lineSyllables.length * 520);
      const endSearchTime = nextLine
        ? Math.min(nextLine.timeMs - 150, lineStart + maxDur + 400)
        : (lineStart + maxDur + 1200);

      const phraseEvents = [];
      for (let eIdx = Math.max(0, lastAssignedEventIdx + 1); eIdx < rhythmicEvents.length; eIdx++) {
        const ev = rhythmicEvents[eIdx];
        if (ev.timeMs >= startSearchTime && ev.timeMs <= endSearchTime) {
          phraseEvents.push({ ev, eIdx });
        } else if (ev.timeMs > endSearchTime) {
          break;
        }
      }

      if (!phraseEvents.length) {
        if (lIdx === 0 && rhythmicEvents.length > 0) {
          const count = Math.min(rhythmicEvents.length, Math.max(lineSyllables.length, 3));
          for (let eIdx = 0; eIdx < count; eIdx++) {
            phraseEvents.push({ ev: rhythmicEvents[eIdx], eIdx });
          }
        } else {
          for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
            line.wordTimestamps[wIdx] = lineStart + wIdx * 350;
          }
          continue;
        }
      }

      const numEvents = phraseEvents.length;
      const numSyllables = lineSyllables.length;

      if (numEvents >= numSyllables) {
        for (let sIdx = 0; sIdx < numSyllables; sIdx++) {
          const syl = lineSyllables[sIdx];
          const item = phraseEvents[sIdx];
          item.ev.notes[0].lyric = syl.text;
          item.ev.notes[0].wordIdx = syl.wordIdx;
          item.ev.notes[0].lineIdx = lIdx;
          if (syl.isFirstOfWord && line.wordTimestamps[syl.wordIdx] === undefined) {
            line.wordTimestamps[syl.wordIdx] = item.ev.notes[0].timestamp_ms;
          }
          lastAssignedEventIdx = item.eIdx;
        }
      } else {
        // Si hay menos notas que sílabas (sinalefas o canto rápido), agrupar sílabas proporcionalmente
        let sylIdx = 0;
        for (let eIdx = 0; eIdx < numEvents; eIdx++) {
          const item = phraseEvents[eIdx];
          const remainingEvents = numEvents - eIdx;
          const remainingSyls = numSyllables - sylIdx;
          const take = (remainingEvents === 1) ? remainingSyls : Math.max(1, Math.round(remainingSyls / remainingEvents));
          const assignedSyls = lineSyllables.slice(sylIdx, sylIdx + take);
          const combinedText = assignedSyls.map(s => s.text).join('').replace(/-+/g, '-');
          const lastSyl = assignedSyls[assignedSyls.length - 1];

          item.ev.notes[0].lyric = combinedText;
          item.ev.notes[0].wordIdx = lastSyl.wordIdx;
          item.ev.notes[0].lineIdx = lIdx;

          assignedSyls.forEach(s => {
            if (s.isFirstOfWord && line.wordTimestamps[s.wordIdx] === undefined) {
              line.wordTimestamps[s.wordIdx] = item.ev.notes[0].timestamp_ms;
            }
          });

          sylIdx += take;
          lastAssignedEventIdx = item.eIdx;
        }
      }

      // Rellenar timestamps para palabras completas
      for (let wIdx = 0; wIdx < rawWords.length; wIdx++) {
        if (!Number.isFinite(line.wordTimestamps[wIdx])) {
          const prevT = (wIdx > 0 && Number.isFinite(line.wordTimestamps[wIdx - 1]))
            ? line.wordTimestamps[wIdx - 1] + 320
            : lineStart + wIdx * 320;
          line.wordTimestamps[wIdx] = prevT;
        }
      }
    }
  }

    update(dt, frameNow) {
    this._frameNow = frameNow || performance.now();
    this._frameDt = dt || 0.00833;
    if (this.isPaused || this.isRewinding) return;

    // ⚡ Reloj único por frame: se calcula una sola vez y se reutiliza en render()
    let currentTime = this.getCurrentGameTimeMs(this._frameNow);
    this._frameGameTimeMs = currentTime;

    if (this.isCalibrating) {
      const now = this._frameNow;
      const currentCalibTime = (now - this.calibrationStartTime) + this.latencyOffsetMs;
      const interval = this.calibrationIntervalMs || (this.isEffectDemoMode ? 720 : 1200);

      if (now >= this.nextCalibNoteTime) {
        const targetHitTime = currentCalibTime + this.scrollDurationMs;
        const audioCtx = this.synth.ensureContext();
        const delaySec = Math.max(0, (this.scrollDurationMs - this.latencyOffsetMs) / 1000);
        if (audioCtx) this.synth.playPianoChime(audioCtx.currentTime + delaySec);

        const spawnLane = this.isEffectDemoMode
          ? ((this._calibLaneCounter = ((this._calibLaneCounter || 0) + 1) % 3))
          : 1;

        this.notes.push({
          id: Date.now() + Math.random(),
          lane: spawnLane,
          type: 'tap',
          timestamp_ms: targetHitTime,
          timeMs: targetHitTime,
          hit: false,
          missed: false,
          flashed: false
        });

        this.nextCalibNoteTime = now + interval;
      }

      for (const note of this.notes) {
        if (!note.flashed && currentCalibTime >= note.timestamp_ms) {
          note.flashed = true;
          const nLane = note.lane ?? 1;
          this.laneGlows[nLane] = 1.0;
          if (this.isEffectDemoMode && !note.hit) {
            this.triggerLaneInput(nLane, 'tap');
          } else if (this.ui && this.ui.onMetronomeBeat) {
            this.ui.onMetronomeBeat();
          }
        }
      }

      if (this.notes.length > 25) {
        this.notes = this.notes.filter(n => (currentCalibTime - n.timestamp_ms) < 1500);
        this.firstActiveNoteIndex = 0;
      }

      this.updateVisualEffects(dt);
      return;
    }

    if (this.isCountingDown) {
      const elapsed = this._frameNow - this.leadInStartTime;
      if (elapsed >= this.leadInDurationMs) {
        this.isCountingDown = false;
        if (typeof window !== 'undefined' && typeof window.pauseMenuAmbientMusic === 'function') {
          try { window.pauseMenuAmbientMusic(); } catch (_) {}
        }
        const startSec = (Number.isFinite(this.beatmapData.startMarkerMs) && this.beatmapData.startMarkerMs > 0)
          ? (this.beatmapData.startMarkerMs / 1000)
          : 0;
        this.sync.seekTo(startSec);
        this.sync.play();
        currentTime = this.getCurrentGameTimeMs(this._frameNow);
        this._frameGameTimeMs = currentTime;
      }
    }

    // Actualización de Teleprompter de Letras en tiempo real (Modo Karaoke)
    if ((!this.activeKaraokeLyrics || this.activeKaraokeLyrics.length === 0) && this.beatmapData && this.beatmapData.activeKaraokeLyrics && this.beatmapData.activeKaraokeLyrics.length > 0) {
      this.activeKaraokeLyrics = this.beatmapData.activeKaraokeLyrics;
    }

    if (typeof window !== 'undefined' && window.isKaraokeModeActive && this.activeKaraokeLyrics && this.activeKaraokeLyrics.length > 0) {
      let curIndex = -1;
      const leadTimeMs = Math.max(900, (this.scrollDurationMs || 1400) * 0.75);
      const startLyricIdx = Math.max(0, (this._lastCurLyricIndex > 0 ? this._lastCurLyricIndex - 1 : 0));
      for (let k = startLyricIdx; k < this.activeKaraokeLyrics.length; k++) {
        const item = this.activeKaraokeLyrics[k];
        const nextItem = this.activeKaraokeLyrics[k + 1];
        const verso = item ? (item.verso || item.syllables || (Array.isArray(item) ? item : [])) : [];

        // Anclar inicio de línea al primer timestamp de la sílaba
        const hasVerso = Array.isArray(verso) && verso.length > 0;
        const lineStart = (hasVerso && Number.isFinite(verso[0].time))
          ? verso[0].time
          : ((item.wordTimestamps && item.wordTimestamps.length > 0 && Number.isFinite(item.wordTimestamps[0])) ? item.wordTimestamps[0] : item.timeMs);

        if (lineStart - leadTimeMs > currentTime + 2000) break;

        // Fin de la estrofa/frase cantada
        const lastSyl = hasVerso ? verso[verso.length - 1] : null;
        const lastNoteTs = (lastSyl && Number.isFinite(lastSyl.time))
          ? (lastSyl.time + (Number(lastSyl.dur) || 350))
          : ((item.wordTimestamps && Number.isFinite(item.wordTimestamps[item.wordTimestamps.length - 1])) ? item.wordTimestamps[item.wordTimestamps.length - 1] : (lineStart + 2500));

        // Inicio de la siguiente estrofa
        const nextVerso = nextItem ? (nextItem.verso || nextItem.syllables || (Array.isArray(nextItem) ? nextItem : [])) : [];
        const nextStart = (Array.isArray(nextVerso) && nextVerso.length > 0 && Number.isFinite(nextVerso[0].time))
          ? nextVerso[0].time
          : ((nextItem && nextItem.wordTimestamps && nextItem.wordTimestamps.length > 0 && Number.isFinite(nextItem.wordTimestamps[0])) ? nextItem.wordTimestamps[0] : (nextItem ? nextItem.timeMs : null));

        const lineEnd = nextStart
          ? Math.min(lastNoteTs + 1200, nextStart - leadTimeMs)
          : (lastNoteTs + 2500);

        if (currentTime >= (lineStart - leadTimeMs) && currentTime < lineEnd) {
          curIndex = k;
          break;
        }
      }

      if (!this._cachedKaraokeEl && typeof document !== 'undefined') {
        this._cachedKaraokeEl = document.getElementById('karaokeCurrentLine');
      }
      const curEl = this._cachedKaraokeEl;

      if (curIndex !== -1 && curIndex !== this._lastCurLyricIndex) {
        this._lastCurLyricIndex = curIndex;
        this.lastLitSyllableIndex = -1;
        const curItem = this.activeKaraokeLyrics[curIndex];
        const verso = curItem ? (curItem.verso || curItem.syllables || (Array.isArray(curItem) ? curItem : [])) : [];

        if (curEl && Array.isArray(verso) && verso.length > 0) {
          if (typeof renderizarVersoKaraoke === 'function') {
            renderizarVersoKaraoke(verso, curEl);
          } else if (typeof window.renderizarVersoKaraoke === 'function') {
            window.renderizarVersoKaraoke(verso, curEl);
          }
        }
      } else if (curIndex === -1 && this._lastCurLyricIndex !== -1) {
        this._lastCurLyricIndex = -1;
        this.lastLitSyllableIndex = -1;
        if (curEl) curEl.innerHTML = '';
      }

      // Iluminación sincronizada de sílabas sin spam al DOM: avanzar lastLitSyllableIndex una sola vez por sílaba
      if (curIndex !== -1 && curEl) {
        const curItem = this.activeKaraokeLyrics[curIndex];
        const verso = curItem ? (curItem.verso || curItem.syllables || (Array.isArray(curItem) ? curItem : [])) : [];
        while (this.lastLitSyllableIndex + 1 < verso.length) {
          const nextSyl = verso[this.lastLitSyllableIndex + 1];
          if (nextSyl && Number.isFinite(nextSyl.time) && currentTime >= nextSyl.time) {
            this.lastLitSyllableIndex++;
            if (typeof iluminarSilaba === 'function') {
              iluminarSilaba(nextSyl.time);
            } else if (typeof window.iluminarSilaba === 'function') {
              window.iluminarSilaba(nextSyl.time);
            }
          } else {
            break;
          }
        }
      }
    }

    // Once a note has passed the hit window (+120ms normal / +185ms en Modo Setas Alucinógenas), it is judged as MISS
    const isMushUpdate = Boolean(this.isMushroomModeActive);
    const exitScreenOffsetMs = isMushUpdate ? 185 : 120;
    const notesLen = this.notes.length;

    while (this.firstActiveNoteIndex < notesLen) {
      const pastN = this.notes[this.firstActiveNoteIndex];
      if (!pastN) { this.firstActiveNoteIndex++; continue; }
      const pastT = pastN.end_timestamp_ms || pastN.timestamp_ms || pastN.timeMs || 0;
      if (currentTime - pastT > 450) {
        pastN.holding = false;
        pastN.processed = true;
        this.firstActiveNoteIndex++;
      } else {
        break;
      }
    }

    const startUpdateIdx = Math.min(this.firstActiveNoteIndex, notesLen);
    for (let i = startUpdateIdx; i < notesLen; i++) {
      const note = this.notes[i];
      if (!note || note.hit || note.missed || note.holding || note.processed || note.holdCompleted) continue;

      const noteTime = Number.isFinite(note.timestamp_ms)
        ? note.timestamp_ms
        : (Number.isFinite(note.timeMs)
            ? note.timeMs
            : (Number.isFinite(note.time) ? (note.time > 100 ? note.time : note.time * 1000) : 0));

      // Si la nota está a más de 1200ms en el futuro, no puede haber caído
      if (noteTime - currentTime > 1200) {
        break;
      }

      // En Modo ECO: si la tecla muelle original alcanzó la barra inferior y aún no lanzó su rebote, activarlo a tiempo
      if (this.isEchoModeActive && note._isEchoSource && note._echoTargetNote && !note._echoTargetNote._echoBounceLaunched && currentTime >= noteTime + 45) {
        const fallbackHitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
        this._launchEchoRebound(note, noteTime, null, fallbackHitY, true);
      }

      // En Modo Setas Alucinógenas: ÚNICAMENTE durante la transición de nube de setas (giro de gravedad),
      // auto-completar las notas para que jamás se pueda fallar en mitad del cambio
      if (this.isMushroomModeActive && this._mushInSafeTransition && currentTime >= noteTime - 60) {
        note.hit = true;
        note.processed = true;
        if (note.type === 'hold') note.holdCompleted = true;
        const autoX = ((note.lane ?? 1) + 0.5) * (this.width / 3);
        const autoY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
        this.judgeHit(note, 10, autoX, autoY, '🍄');
        this.emitKeyHit(autoX, autoY, '#ff00ff', 14);
        continue;
      }

      if (currentTime >= 0 && (currentTime - noteTime >= exitScreenOffsetMs)) {
        if (note.isMine) {
          // ¡Mina esquivada con éxito! No penalizar ni cortar el combo
          note.hit = true;
          note.processed = true;
          this._emitMineDodgedFeedback(note.lane);
          continue;
        }
        if (this.isMushroomModeActive && this._mushInSafeTransition) {
          note.hit = true;
          note.processed = true;
          if (note.type === 'hold') note.holdCompleted = true;
          continue;
        }
        note.missed = true;
        note.processed = true;
        note.missHighlight = true;
        this.missHighlight = {
          type: 'note_dropped',
          lane: note.lane,
          note: note,
          time: this._frameNow
        };

        this.synth.playPunchyArcadeMiss();
        this.addJudgement('MISS', '#ff4d4d', note.lane);
        this.handleMiss();
        break;
      }
    }

    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    for (const [lane, active] of this.activeHolds.entries()) {
      const note = active.note;
      const endT = note.end_timestamp_ms || (note.timestamp_ms + (note.duration_ms || 700));
      const hitX = (this.visualDimension !== '2d')
        ? (this.getLaneBoundaryX(lane, hitY) + this.getLaneBoundaryX(lane + 1, hitY)) * 0.5
        : (lane + 0.5) * this.laneWidth;
      const holdColor = (active.color && active.color !== '#00ff88' && active.color !== '#00f2fe') ? active.color : '#ffe082';
      this.laneFlashTimers[lane] = 0.11;

      if (!active._lastSparkTime || (this._frameNow - active._lastSparkTime >= 22)) {
        active._lastSparkTime = this._frameNow;
        this.particles.emitHoldSparks(hitX, hitY, holdColor, 2);
      }
      this.addScore(Math.round(260 * dt * this.multiplier));

      // Keep vignette alive and colored during full_focus holds
      if (this.activeEffect && this.activeEffect.startsWith('full_focus')) {
        this.vignetteColor = holdColor;
        this.vignetteAlpha = Math.max(this.vignetteAlpha, 0.55);
      }

      if (currentTime >= endT) {
        note.holdCompleted = true;
        note.hit = true;
        note.holding = false;
        this.activeHolds.delete(lane);
        this.emitKeyHit(hitX, hitY, holdColor, 35);
        this.addJudgement('HOLD CLEAR!', '#ffe082');
      }
    }

    this.updateVisualEffects(dt);

    if (this.beatmapData && this.notes.length > 0 && !this.isGameOver) {
      const lastNoteTime = this.lastNoteTime || 0;
      const hasExplicitEnd = Number.isFinite(this.beatmapData.endMarkerMs) && this.beatmapData.endMarkerMs > 0;
      const endLimitMs = hasExplicitEnd
        ? this.beatmapData.endMarkerMs
        : (Number.isFinite(this.beatmapData.endTimestampMs) && this.beatmapData.endTimestampMs > 0
            ? this.beatmapData.endTimestampMs
            : (lastNoteTime + 1400));

      const isPastEnd = currentTime >= endLimitMs;
      const isPastLastNote = !hasExplicitEnd && (currentTime > (lastNoteTime + 1400));
      const isAudioFinished = this.sync.duration > 0 && (currentTime / 1000 >= this.sync.duration - 0.25);

      if (isPastEnd || isPastLastNote || isAudioFinished) {
        this.triggerGameEnd();
      }
    }
  }

  triggerGameEnd() {
    if (this.isGameOver || !this.beatmapData) return;
    this.isGameOver = true;
    this.isRunning = false;
    this.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.sync.pause();

    const totalNotes = (this.notes && this.notes.filter(n => n && !n.isMine).length) || 0;
    const maxScore = Math.max(1, this.maxPossibleScore || 1);
    const scorePct = Math.min(100.0, Math.max(0.0, (this.score / maxScore) * 100));

    // Precisión de impacto física:
    const totalJudged = (this.stats.perfectPlus || 0) + (this.stats.perfect || 0) + (this.stats.great || 0) + (this.stats.good || 0) + (this.stats.miss || 0);
    const accuracyPct = totalJudged > 0
      ? Math.min(100.0, Math.max(0.0, (((this.stats.perfectPlus * 100) + (this.stats.perfect * 80) + (this.stats.great * 50) + ((this.stats.good || 0) * 25)) / (totalJudged * 100)) * 100))
      : 100.0;

    // La evaluación de estrellas y medallas se rige ESTRICTAMENTE por scorePct:
    // 5★: >= 90% | 4★: >= 75% | 3★: >= 60% | 2★: >= 40% | 1★: >= 20%
    let stars = 0;
    if (scorePct >= 90.0) {
      stars = 5;
    } else if (scorePct >= 75.0) {
      stars = 4;
    } else if (scorePct >= 60.0) {
      stars = 3;
    } else if (scorePct >= 40.0) {
      stars = 2;
    } else if (scorePct >= 20.0) {
      stars = 1;
    }
    this.stars = Math.max(this.stars, stars);

    // Medallas: Requiere un mínimo de 100 notas en la pista
    // Plata: >= 92% | Oro: >= 94% | Platino: >= 96%
    let finalMedal = null;
    const earnedMedals = { silver: 0, gold: 0, platinum: 0 };
    if (totalNotes >= 100) {
      if (scorePct >= 96.0) {
        finalMedal = 'platinum';
        earnedMedals.platinum = 1;
        earnedMedals.gold = 1;
        earnedMedals.silver = 1;
      } else if (scorePct >= 94.0) {
        finalMedal = 'gold';
        earnedMedals.gold = 1;
        earnedMedals.silver = 1;
      } else if (scorePct >= 92.0) {
        finalMedal = 'silver';
        earnedMedals.silver = 1;
      }
    }
    this.currentMedalTier = finalMedal;

    // Claves (Clefs) según fórmula solicitada: puntuación * 0.00001 * dificultad (estrellas, máximo x7) con x2 en destacadas
    const rawDiffStars = Number(this.beatmapData?.metadata?.stars || this.beatmapData?.stars || this.stars || 3.0);
    const diffMultiplier = Math.min(7, Math.max(1, Math.round(rawDiffStars * 10) / 10));
    const baseScoreClefs = Math.floor((this.score || 0) * 0.00001);
    const isFeatured = !!(
      this.beatmapData?.is_daily_featured || 
      this.beatmapData?.metadata?.is_daily_featured || 
      (typeof window !== 'undefined' && (window.currentActiveBeatmap?.is_daily_featured || window.currentActiveBeatmap?.metadata?.is_daily_featured || window.currentFeaturedSongX2))
    );
    const isStormX2 = Boolean(
      this.isStormModeActive ||
      this.isMushroomModeActive ||
      this.isHighwayModeActive ||
      this.isAnnoyingDogModeActive ||
      this.isRiverModeActive ||
      this.isMinesweeperModeActive ||
      this.isMirrorModeActive ||
      this.isEchoModeActive ||
      (typeof window !== 'undefined' && (window.isStormModeActive || window.isMushroomModeActive || window.isHighwayModeActive || window.isAnnoyingDogModeActive || window.isRiverModeActive || window.isMinesweeperModeActive || window.isMirrorModeActive || window.isEchoModeActive))
    );
    const clefMultiplier = (isFeatured ? 2 : 1) * (isStormX2 ? 2 : 1);
    const earnedClefs = Math.max(1, Math.round(baseScoreClefs * diffMultiplier)) * clefMultiplier;

    // Consumir inmediatamente el multiplicador x2 de tragaperras para que NO afecte a partidas posteriores
    if (typeof window !== 'undefined') {
      window.currentFeaturedSongX2 = false;
    }

    // Adjuntar telemetría de sincronización de impacto en stats para el informe y auto-calibración
    const ts = this.timingStats || { count: 0, sumSignedMs: 0, sumAbsMs: 0, earlyCount: 0, lateCount: 0, exactCount: 0 };
    this.stats.timing = {
      count: ts.count,
      avgSignedMs: ts.count > 0 ? Math.round((ts.sumSignedMs / ts.count) * 10) / 10 : 0,
      avgAbsMs: ts.count > 0 ? Math.round((ts.sumAbsMs / ts.count) * 10) / 10 : 0,
      earlyCount: ts.earlyCount,
      lateCount: ts.lateCount,
      exactCount: ts.exactCount
    };

    if (this.ui && this.ui.onGameEnd) {
      this.ui.onGameEnd(this.score, this.maxCombo, this.stars, this.stats, earnedClefs, finalMedal, scorePct, earnedMedals, totalNotes, accuracyPct);
    }
  }

  updateVisualEffects(dt) {
    if (this.shakeDuration > 0) {
      this.shakeDuration = Math.max(0, this.shakeDuration - dt);
    }

    // Efecto blanco de Overdrive en X4 desactivado completamente para mantener la pista limpia y contrastada
    this.overdriveLevel = 0;
    this.overdriveFlash = 0;
    this._wasOverdrive = false;

    if (typeof this.displayScore !== 'number') this.displayScore = 0;
    if (Math.abs(this.displayScore - this.score) > 0.5) {
      this.displayScore += (this.score - this.displayScore) * 0.20;
    } else {
      this.displayScore = this.score;
    }

    // Física de la Bola de Discoteca (Aparece y desciende ÚNICAMENTE a partir de combo 200)
    if (this.discoBall) {
      const is200Combo = (this.combo >= 200);
      if (is200Combo) {
        this.discoBall.active = true;
        this.discoBall.targetY = 86; // Posición suspendida bajo el contador de estrellas
      } else {
        this.discoBall.targetY = -120; // Asciende y se oculta en el techo
      }

      if (this.discoBall.descendY < this.discoBall.targetY) {
        this.discoBall.descendY += (this.discoBall.targetY - this.discoBall.descendY) * Math.min(1, dt * 2.8);
      } else if (this.discoBall.descendY > this.discoBall.targetY) {
        this.discoBall.descendY += (this.discoBall.targetY - this.discoBall.descendY) * Math.min(1, dt * 4.2);
      }

      if (!is200Combo && this.discoBall.descendY <= -105) {
        this.discoBall.active = false;
      }

      if (this.discoBall.active || this.discoBall.descendY > -100) {
        const activeBpm = this.currentBpm || (this.beatmapData && this.beatmapData.metadata ? this.beatmapData.metadata.bpm : 128) || 128;
        const bpmFactor = activeBpm / 120;
        this.discoBall.rotation += this.discoBall.rotSpeed * dt * (0.85 + 0.40 * bpmFactor);
      }
    }

    // Actualizar Explosiones 3D Cinemáticas y Partículas en Profundidad
    if (this.combo3DExplosions && this.combo3DExplosions.length > 0) {
      for (let i = this.combo3DExplosions.length - 1; i >= 0; i--) {
        const exp = this.combo3DExplosions[i];
        exp.age += dt;
        exp.radius += (exp.maxRadius - exp.radius) * 4.2 * dt;
        exp.rotation += 0.65 * dt;

        // Rebote elástico del rótulo 3D
        if (exp.age < 0.18) {
          const p = exp.age / 0.18;
          exp.scale = 1.0 + 0.70 * Math.cos(p * Math.PI * 0.5);
        } else {
          exp.scale = 1.0 + 0.04 * Math.sin((exp.age - 0.18) * 3.5);
        }

        if (exp.age > exp.duration - 0.45) {
          exp.alpha = Math.max(0, (exp.duration - exp.age) / 0.45);
        }

        // Simulación 3D de chispas
        if (exp.sparks) {
          for (let s = exp.sparks.length - 1; s >= 0; s--) {
            const sp = exp.sparks[s];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.z += (sp.vz || 0) * dt;
            sp.vy += 140 * dt;
            sp.rot += (sp.rotSpeed || 0) * dt;
            sp.alpha -= (sp.decay || 2.0) * dt;
            if (sp.alpha <= 0) exp.sparks.splice(s, 1);
          }
        }

        if (exp.age >= exp.duration) {
          if (this.topComboToast === exp) this.topComboToast = null;
          this.combo3DExplosions.splice(i, 1);
        }
      }
    }

    // Progresión de transición de color ambiental de la atmósfera
    if (this.atmosphereShiftProgress < 1.0) {
      this.atmosphereShiftProgress = Math.min(1.0, this.atmosphereShiftProgress + dt * 1.8);
    }

    const maxGlowLanes = Math.max(4, this.numLanes || 3);
    for (let l = 0; l < maxGlowLanes; l++) {
      this.laneGlows[l] = Math.max(0, (this.laneGlows[l] || 0) - dt * 4.0);
      if (this.laneFlashTimers && this.laneFlashTimers[l] > 0) {
        this.laneFlashTimers[l] = Math.max(0, this.laneFlashTimers[l] - dt);
      }
    }
    if (this.isMinesweeperModeActive || (this._mineExplosions && this._mineExplosions.length > 0) || (this._shatteredKeyFragments && this._shatteredKeyFragments.length > 0)) {
      this.updateMinesweeperEffects(dt);
    }
    if (this.isMirrorModeActive || (typeof window !== 'undefined' && window.isMirrorModeActive)) {
      this.updateMirrorModeEffects(dt);
    }
    if (this.isEchoModeActive || (typeof window !== 'undefined' && window.isEchoModeActive)) {
      this.updateEchoModeEffects(dt);
    }

    for (let i = this.judgements.length - 1; i >= 0; i--) {
      const j = this.judgements[i];
      j.age += dt;
      // Compresión elástica visual: nace en 1.45 y se comprime a 1.0 en 90ms (0.09s)
      if (j.age < 0.09) {
        const p = j.age / 0.09;
        j.scale = 1.0 + 0.45 * Math.cos(p * Math.PI * 0.5);
      } else {
        j.scale = 1.0;
        j.alpha -= dt * 2.8;
      }
      // Flota 15px hacia arriba mientras decae la opacidad
      j.y = j.baseY - Math.min(15, (j.age / 0.35) * 15);
      if (j.alpha <= 0) this.judgements.splice(i, 1);
    }

    for (let i = this.fxRipples.length - 1; i >= 0; i--) {
      const r = this.fxRipples[i];
      r.radius += (r.maxRadius - r.radius) * 7.5 * dt;
      r.alpha -= r.decay * dt;
      if (r.alpha <= 0) this.fxRipples.splice(i, 1);
    }

    for (let i = this.bgBursts.length - 1; i >= 0; i--) {
      const b = this.bgBursts[i];
      b.age = (b.age || 0) + dt;
      b.radius += (b.maxRadius - b.radius) * 5.5 * dt;
      if (b.rotation !== undefined) {
        b.rotation += (b.rotSpeed || 0) * dt;
      }
      b.alpha -= b.decay * dt;
      if (b.alpha <= 0) this.bgBursts.splice(i, 1);
    }

    if (this.vignetteAlpha > 0.001) {
      this.vignetteAlpha = Math.max(0, this.vignetteAlpha - dt * 3.2);
    }

    if (this.reactiveLightBoost > 0.001) {
      this.reactiveLightBoost = Math.max(0, this.reactiveLightBoost - dt * 1.5);
    }

    for (let i = this.musicalNotes.length - 1; i >= 0; i--) {
      const mn = this.musicalNotes[i];
      mn.wobble += dt * 5.0;
      mn.x += (mn.vx + Math.sin(mn.wobble) * 22) * dt;
      mn.y += mn.vy * dt;
      mn.vy += 30 * dt;
      mn.rot += mn.rotSpeed * dt;
      mn.alpha -= mn.decay * dt;
      mn.scale += dt * 0.15;
      if (mn.alpha <= 0) this.musicalNotes.splice(i, 1);
    }

    this.particles.update(dt);
  }

  /**
   * Canvas Background & Concert Atmosphere:
   * Fondos atmosféricos dinámicos de estadio con iluminación volumétrica,
   * focos móviles, estelas de velocidad en perspectiva y apoteosis reactiva al BPM y multiplicador.
   */

  // =========================================================================
  // SYNTHESIZER EQUALIZER STRIPES WITH LARGE COLORED BLOCKS
  // Abarcan desde el 75% hasta arriba del todo, más largas arriba, reactivas a teclas
  // =========================================================================
  getEffectBorderTheme(fxRaw) {
    const fx = this.normalizeEffectId(fxRaw || this.activeEffect);
    const THEMES = {
      solar_inferno: {
        id: 'solar_inferno',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#f97316',
        cOuter: '#dc2626',
        cDeep: '#7f1d1d',
        blocks: ['#7f1d1d', '#b91c1c', '#dc2626', '#ea580c', '#f97316', '#facc15', '#fde047']
      },
      cryo_blizzard: {
        id: 'cryo_blizzard',
        cCore: '#ffffff',
        cInner: '#e0f2fe',
        cMid: '#38bdf8',
        cOuter: '#0284c7',
        cDeep: '#0c4a6e',
        blocks: ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd']
      },
      cyber_neon: {
        id: 'cyber_neon',
        cCore: '#ffffff',
        cInner: '#00f2fe',
        cMid: '#ff007f',
        cOuter: '#a855f7',
        cDeep: '#3b0764',
        blocks: ['#4c1d95', '#7e22ce', '#a855f7', '#db2777', '#ff007f', '#06b6d4', '#00f2fe']
      },
      grand_fireworks: {
        id: 'grand_fireworks',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#ff007f',
        cOuter: '#00f2fe',
        cDeep: '#39ff14',
        blocks: ['#be185d', '#ff007f', '#f59e0b', '#fde047', '#39ff14', '#00f2fe', '#e879f9']
      },
      zeus_lightning: {
        id: 'zeus_lightning',
        cCore: '#ffffff',
        cInner: '#bae6fd',
        cMid: '#38bdf8',
        cOuter: '#6366f1',
        cDeep: '#1e1b4b',
        blocks: ['#1e1b4b', '#312e81', '#4338ca', '#6366f1', '#38bdf8', '#7dd3fc', '#e0f2fe']
      },
      deep_cosmos: {
        id: 'deep_cosmos',
        cCore: '#ffffff',
        cInner: '#f472b6',
        cMid: '#a855f7',
        cOuter: '#06b6d4',
        cDeep: '#2e1065',
        blocks: ['#2e1065', '#4c1d95', '#6d28d9', '#9333ea', '#c084fc', '#f472b6', '#22d3ee']
      },
      asteroid_impact: {
        id: 'asteroid_impact',
        cCore: '#ffffff',
        cInner: '#facc15',
        cMid: '#ea580c',
        cOuter: '#b91c1c',
        cDeep: '#451a03',
        blocks: ['#451a03', '#7c2d12', '#991b1b', '#dc2626', '#ea580c', '#f59e0b', '#fde047']
      },
      black_hole: {
        id: 'black_hole',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#f97316',
        cOuter: '#db2777',
        cDeep: '#4c1d95',
        blocks: ['#2e1065', '#581c87', '#831843', '#be185d', '#ea580c', '#f97316', '#fde047']
      },
      dragon_fire: {
        id: 'dragon_fire',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#10b981',
        cOuter: '#047857',
        cDeep: '#064e3b',
        blocks: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#fde047']
      },
      aurora_borealis: {
        id: 'aurora_borealis',
        cCore: '#ffffff',
        cInner: '#34d399',
        cMid: '#06b6d4',
        cOuter: '#8b5cf6',
        cDeep: '#f43f5e',
        blocks: ['#4c1d95', '#7c3aed', '#0891b2', '#06b6d4', '#10b981', '#34d399', '#a7f3d0']
      },
      supernova_burst: {
        id: 'supernova_burst',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#ff007f',
        cOuter: '#00f2fe',
        cDeep: '#701a75',
        blocks: ['#701a75', '#a21caf', '#db2777', '#ff007f', '#f59e0b', '#fde047', '#00f2fe']
      },
      quantum_prism: {
        id: 'quantum_prism',
        cCore: '#ffffff',
        cInner: '#39ff14',
        cMid: '#00f2fe',
        cOuter: '#a855f7',
        cDeep: '#0f172a',
        blocks: ['#1e1b4b', '#581c87', '#7e22ce', '#0369a1', '#00f2fe', '#22c55e', '#39ff14']
      },
      astral_transcendence: {
        id: 'astral_transcendence',
        cCore: '#ffffff',
        cInner: '#fde047',
        cMid: '#00f2fe',
        cOuter: '#ff007f',
        cDeep: '#2e1065',
        blocks: ['#1e1b4b', '#4c1d95', '#be185d', '#ff007f', '#a855f7', '#00f2fe', '#fde047']
      }
    };
    return THEMES[fx] || THEMES.solar_inferno;
  }

  renderEqualizerBorders(ctx, w, h, currentTime, bpmSpeed, beatPulse, mult) {
    if (!this.borderEqLeftSurges) this.borderEqLeftSurges = new Float32Array(16);
    if (!this.borderEqRightSurges) this.borderEqRightSurges = new Float32Array(16);

    const frameScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
    const decayStep = 0.036 * frameScale;
    const numBars = 12;
    let avgSurgeL = 0;
    let avgSurgeR = 0;
    for (let i = 0; i < numBars; i++) {
      if (this.borderEqLeftSurges[i] > 0) {
        this.borderEqLeftSurges[i] = Math.max(0, this.borderEqLeftSurges[i] - decayStep);
      }
      if (this.borderEqRightSurges[i] > 0) {
        this.borderEqRightSurges[i] = Math.max(0, this.borderEqRightSurges[i] - decayStep);
      }
      avgSurgeL += this.borderEqLeftSurges[i];
      avgSurgeR += this.borderEqRightSurges[i];
    }
    avgSurgeL /= numBars;
    avgSurgeR /= numBars;

    const theme = this.getEffectBorderTheme(this.activeEffect);
    const fx = theme.id;
    const blockPalette = theme.blocks;
    const palLen = blockPalette.length;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const timeSec = (this._frameNow || performance.now()) * 0.001;
    const waveT = timeSec * 1.65;

    // 0. DIFUMINADO ATMOSFÉRICO SUPERIOR EN LOS BORDES (Pre-cacheado por dimensión y efecto: 0 allocs/frame)
    const topZoneY = h * 0.20;
    const leftBloomR = Math.max(85, w * 0.34);
    const cacheKey = `${w}_${h}_${fx}`;
    if (!this._eqGradCache || this._eqGradCache.key !== cacheKey) {
      const lBloom = ctx.createRadialGradient(w * 0.08, topZoneY, 4, w * 0.08, topZoneY, leftBloomR);
      lBloom.addColorStop(0.0, hexToRgba(theme.cMid, 0.36));
      lBloom.addColorStop(0.55, hexToRgba(theme.cOuter, 0.16));
      lBloom.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      const rBloom = ctx.createRadialGradient(w * 0.92, topZoneY, 4, w * 0.92, topZoneY, leftBloomR);
      rBloom.addColorStop(0.0, hexToRgba(theme.cMid, 0.36));
      rBloom.addColorStop(0.55, hexToRgba(theme.cOuter, 0.16));
      rBloom.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      const lRib = ctx.createLinearGradient(4, 0, w * 0.36, 0);
      lRib.addColorStop(0.0, hexToRgba(theme.cOuter, 0.42));
      lRib.addColorStop(0.7, hexToRgba(theme.cInner, 0.24));
      lRib.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      const rRib = ctx.createLinearGradient(w - 4, 0, w * 0.64, 0);
      rRib.addColorStop(0.0, hexToRgba(theme.cOuter, 0.42));
      rRib.addColorStop(0.7, hexToRgba(theme.cInner, 0.24));
      rRib.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      this._eqGradCache = { key: cacheKey, lBloom, rBloom, lRib, rRib };
    }

    ctx.globalAlpha = Math.min(1.0, 0.65 + avgSurgeL * 0.55 + beatPulse * 0.25);
    ctx.fillStyle = this._eqGradCache.lBloom;
    ctx.fillRect(0, 0, w * 0.45, h * 0.45);

    ctx.globalAlpha = Math.min(1.0, 0.65 + avgSurgeR * 0.55 + beatPulse * 0.25);
    ctx.fillStyle = this._eqGradCache.rBloom;
    ctx.fillRect(w * 0.55, 0, w * 0.45, h * 0.45);
    ctx.globalAlpha = 1.0;

    const blockW = 11.5;
    const blockH = 7.6;
    const blockGap = 1.6;

    const renderSideEqualizerZone = (isLeft) => {
      let prevPeakX = null;
      let prevPeakY = null;
      const cachedRibGrad = isLeft ? this._eqGradCache.lRib : this._eqGradCache.rRib;

      for (let i = 0; i < numBars; i++) {
        const frac = i / (numBars - 1);
        const y = h * (0.04 + frac * 0.33);
        const trackEdgeX = isLeft
          ? (this.getLaneBoundaryX(0, y) - 7)
          : (this.getLaneBoundaryX(3, y) + 7);
        const outerEdgeX = isLeft ? 4 : (w - 4);
        const availW = Math.max(14, isLeft ? (trackEdgeX - outerEdgeX) : (outerEdgeX - trackEdgeX));
        const totalPossibleBlocks = Math.max(2, Math.floor((availW + blockGap) / (blockW + blockGap)));

        const phaseShift = isLeft ? 0 : 1.85;
        const organicRand = 0.62
          + 0.26 * Math.sin(i * 3.1 + waveT + phaseShift)
          + 0.18 * Math.cos(i * 5.7 - waveT * 0.8 + phaseShift)
          + 0.14 * Math.sin((i + mult) * 2.1 + waveT * 1.4);
        const slopeFactor = 1.0 - (frac * 0.35);
        const rowMaxBlocks = Math.max(2, Math.round(totalPossibleBlocks * Math.max(0.32, Math.min(1.0, slopeFactor * organicRand))));

        const surge = (isLeft ? this.borderEqLeftSurges[i] : this.borderEqRightSurges[i]) || 0;
        const beatDrive = 0.25 + beatPulse * 0.35;
        const effectiveDrive = Math.min(1.0, Math.max(beatDrive * 0.65, surge));
        const activeBlocks = Math.max(1, Math.min(rowMaxBlocks, Math.round(1 + effectiveDrive * (rowMaxBlocks - 1))));
        const rowSpanPx = activeBlocks * (blockW + blockGap);

        // 1. Cinta difuminada de fondo por cada fila (0 allocs/frame)
        const rowStartX = outerEdgeX;
        const rowEndX = isLeft ? (outerEdgeX + rowSpanPx + 14) : (outerEdgeX - rowSpanPx - 14);
        ctx.globalAlpha = 0.55 + effectiveDrive * 0.45;
        ctx.fillStyle = cachedRibGrad;
        ctx.fillRect(
          Math.min(rowStartX, rowEndX),
          y - blockH * 0.85,
          Math.abs(rowEndX - rowStartX),
          blockH * 1.7
        );

        // 2. Cuadraditos con degradado temático del efecto activo (fillRect directo para máximo rendimiento GPU)
        const alphaBase = 0.26 + effectiveDrive * 0.62;
        for (let b = 0; b < activeBlocks; b++) {
          const bx = isLeft
            ? (outerEdgeX + b * (blockW + blockGap))
            : (outerEdgeX - (b + 1) * (blockW + blockGap));
          const colIdx = Math.min(palLen - 1, Math.floor((b / Math.max(1, rowMaxBlocks - 1)) * palLen));
          ctx.fillStyle = blockPalette[colIdx];
          ctx.globalAlpha = (b === 0 && surge <= 0.02) ? 0.28 : alphaBase;
          ctx.fillRect(bx, y - blockH / 2, blockW, blockH);
        }

        // Coordenada de la punta activa (Peak) de esta fila superior
        const peakX = isLeft
          ? (outerEdgeX + (activeBlocks - 1) * (blockW + blockGap) + blockW * 0.5)
          : (outerEdgeX - (activeBlocks - 1) * (blockW + blockGap) - blockW * 0.5);
        const dirSign = isLeft ? 1 : -1;

        // 3. Punta incandescente en el extremo de cada fila
        ctx.globalAlpha = Math.min(0.95, 0.45 + effectiveDrive * 0.55);
        ctx.fillStyle = theme.cCore;
        ctx.fillRect(peakX - blockW * 0.5, y - blockH / 2, blockW, blockH);

        // 4. FENÓMENO COMPLEMENTARIO EN LA PARTE SUPERIOR SEGÚN EL EFECTO ACTIVO (0 Gradient Allocs)
        if (fx === 'solar_inferno' || fx === 'dragon_fire') {
          const flameLen = (10 + effectiveDrive * 22) * (1 + 0.25 * Math.sin(timeSec * 11 + i * 1.7));
          const flameLift = -6 - 5 * Math.cos(timeSec * 9 + i);
          ctx.fillStyle = theme.cMid;
          ctx.globalAlpha = 0.68;
          ctx.beginPath();
          ctx.moveTo(peakX, y - blockH * 0.65);
          ctx.quadraticCurveTo(
            peakX + dirSign * flameLen * 0.65,
            y - blockH * 0.9 + flameLift * 0.5,
            peakX + dirSign * flameLen,
            y + flameLift
          );
          ctx.quadraticCurveTo(
            peakX + dirSign * flameLen * 0.55,
            y + blockH * 0.75,
            peakX,
            y + blockH * 0.65
          );
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = theme.cInner;
          ctx.globalAlpha = 0.82;
          ctx.beginPath();
          ctx.moveTo(peakX, y - blockH * 0.35);
          ctx.lineTo(peakX + dirSign * flameLen * 0.58, y + flameLift * 0.55);
          ctx.lineTo(peakX, y + blockH * 0.35);
          ctx.closePath();
          ctx.fill();
        } else if (fx === 'cryo_blizzard') {
          const spikeLen = 9 + effectiveDrive * 18;
          ctx.fillStyle = theme.cInner;
          ctx.globalAlpha = 0.80;
          ctx.beginPath();
          ctx.moveTo(peakX, y - blockH * 0.55);
          ctx.lineTo(peakX + dirSign * spikeLen, y);
          ctx.lineTo(peakX, y + blockH * 0.55);
          ctx.closePath();
          ctx.fill();
        } else if (fx === 'zeus_lightning' && prevPeakX !== null) {
          const midArcX = (prevPeakX + peakX) * 0.5 + Math.sin(timeSec * 28 + i * 3.1) * 7;
          const midArcY = (prevPeakY + y) * 0.5;
          ctx.strokeStyle = theme.cMid;
          ctx.lineWidth = 2.6;
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.moveTo(prevPeakX, prevPeakY);
          ctx.lineTo(midArcX, midArcY);
          ctx.lineTo(peakX, y);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        } else if (fx === 'grand_fireworks' || fx === 'supernova_burst') {
          if (i % 2 === 0) {
            const starR = 5 + effectiveDrive * 9;
            ctx.strokeStyle = i % 4 === 0 ? theme.cInner : theme.cMid;
            ctx.lineWidth = 1.8;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.moveTo(peakX - starR, y);
            ctx.lineTo(peakX + starR, y);
            ctx.moveTo(peakX, y - starR);
            ctx.lineTo(peakX, y + starR);
            ctx.stroke();
          }
        } else if (fx === 'aurora_borealis' || fx === 'deep_cosmos' || fx === 'cyber_neon') {
          if (prevPeakX !== null) {
            ctx.strokeStyle = i % 2 === 0 ? theme.cInner : theme.cMid;
            ctx.lineWidth = 2.2;
            ctx.globalAlpha = 0.62;
            ctx.beginPath();
            ctx.moveTo(prevPeakX, prevPeakY);
            ctx.quadraticCurveTo(
              (prevPeakX + peakX) * 0.5 + dirSign * 6 * Math.sin(timeSec * 5 + i),
              (prevPeakY + y) * 0.5,
              peakX,
              y
            );
            ctx.stroke();
          }
        } else if (fx === 'quantum_prism' && i % 2 === 0) {
          const cSz = 5 + effectiveDrive * 5;
          ctx.save();
          ctx.translate(peakX + dirSign * 6, y);
          ctx.rotate(timeSec * 2.5 + i);
          ctx.strokeStyle = theme.cInner;
          ctx.lineWidth = 1.4;
          ctx.globalAlpha = 0.82;
          ctx.strokeRect(-cSz * 0.5, -cSz * 0.5, cSz, cSz);
          ctx.restore();
        } else if (fx === 'astral_transcendence') {
          // Constelaciones Astrales Sagradas conectando las puntas del ecualizador + Astrolabios Giratorios
          if (prevPeakX !== null) {
            ctx.strokeStyle = i % 2 === 0 ? '#00f2fe' : '#fde047';
            ctx.lineWidth = 2.0;
            ctx.globalAlpha = 0.78;
            ctx.beginPath();
            ctx.moveTo(prevPeakX, prevPeakY);
            ctx.lineTo(peakX + dirSign * 5, y);
            ctx.stroke();
          }
          if (i % 2 === 0) {
            const astR = 5.5 + effectiveDrive * 6.5;
            const ax = peakX + dirSign * 6;
            ctx.save();
            ctx.translate(ax, y);
            ctx.rotate(timeSec * 3.2 + i);
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.90;
            ctx.beginPath();
            ctx.moveTo(0, -astR);
            ctx.lineTo(astR, 0);
            ctx.lineTo(0, astR);
            ctx.lineTo(-astR, 0);
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1.5, -1.5, 3, 3);
            ctx.restore();
          }
        }

        prevPeakX = peakX;
        prevPeakY = y;
      }
    };

    renderSideEqualizerZone(true);
    renderSideEqualizerZone(false);

    ctx.restore();
  }

  renderBackgroundFX(currentTime) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!w || !h) return;

    const horizY = Math.max(14, h * 0.035);
    const safePerfNow = this._frameNow || performance.now();

    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : { primary: '#c5a059', secondary: '#ede5d8', glow: '#c5a059', ribs: '#e5b869', spotlight1: '#c5a059', spotlight2: '#8c6d23', spark: '#fff3cf' });

    const mult = this.multiplier || 1;
    const rawBpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : (this.bpm || 120);
    let normBpm = rawBpm;
    while (normBpm > 175) normBpm /= 2;
    while (normBpm < 75) normBpm *= 2;
    const beatInterval = 60 / normBpm;
    const audioTime = (currentTime >= 0 ? currentTime : safePerfNow) / 1000;
    const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
    const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.8);


    // 0. IMAGEN DE FONDO PERSONALIZADA DE LA CANCIÓN
    const customBgSrc = this.beatmapData && (this.beatmapData.background_image || this.beatmapData.bg_image || (this.beatmapData.metadata && (this.beatmapData.metadata.background_image || this.beatmapData.metadata.bg_image)));
    if (customBgSrc) {
      if (!this.cachedCustomBgImg || this.cachedCustomBgSrc !== customBgSrc) {
        this.cachedCustomBgSrc = customBgSrc;
        this.cachedCustomBgImg = new Image();
        this.cachedCustomBgImg.crossOrigin = 'anonymous';
        this.cachedCustomBgImg.src = customBgSrc;
      }
      if (this.cachedCustomBgImg && this.cachedCustomBgImg.complete && this.cachedCustomBgImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.40;
        const imgW = this.cachedCustomBgImg.naturalWidth;
        const imgH = this.cachedCustomBgImg.naturalHeight;
        const s = Math.max(w / imgW, h / imgH);
        const dw = imgW * s;
        const dh = imgH * s;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(this.cachedCustomBgImg, dx, dy, dw, dh);
        ctx.restore();
      }
    }

    // En Modo Río: Toda la ambientación exterior y superior es un cañón fluvial natural con cascadas, bruma de agua y rayos de sol filtrados
    const isRiverBg = Boolean(this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive));
    if (isRiverBg) {
      if (!this._riverCanyonBgGrad || this._riverCanyonBgGradH !== h) {
        this._riverCanyonBgGradH = h;
        const rbg = ctx.createLinearGradient(0, 0, 0, h);
        rbg.addColorStop(0.00, '#021824');
        rbg.addColorStop(0.28, '#052e3e');
        rbg.addColorStop(0.62, '#06394c');
        rbg.addColorStop(1.00, '#021c29');
        this._riverCanyonBgGrad = rbg;
      }
      ctx.fillStyle = this._riverCanyonBgGrad;
      ctx.fillRect(-20, -20, w + 40, h + 40);

      // Rayos solares acuáticos filtrándose desde el dosel del río
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sunSway1 = Math.sin(safePerfNow * 0.0008) * (w * 0.18);
      const sunSway2 = Math.cos(safePerfNow * 0.0009 + 1.2) * (w * 0.18);
      ctx.fillStyle = `rgba(56, 189, 248, ${(0.07 + beatPulse * 0.04).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(w * 0.18 - 24, -10);
      ctx.lineTo(w * 0.18 + 24, -10);
      ctx.lineTo(w * 0.45 + sunSway1 + w * 0.16, h * 0.85);
      ctx.lineTo(w * 0.45 + sunSway1 - w * 0.16, h * 0.85);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(52, 211, 153, ${(0.06 + beatPulse * 0.035).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(w * 0.82 - 24, -10);
      ctx.lineTo(w * 0.82 + 24, -10);
      ctx.lineTo(w * 0.55 + sunSway2 + w * 0.16, h * 0.85);
      ctx.lineTo(w * 0.55 + sunSway2 - w * 0.16, h * 0.85);
      ctx.closePath();
      ctx.fill();

      // Rocío de cascada y luciérnagas acuáticas flotando en los márgenes
      if (!this._riverMistParticles || this._riverMistParticles.length === 0) {
        this._riverMistParticles = [];
        for (let i = 0; i < 24; i++) {
          this._riverMistParticles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 1.2 + Math.random() * 2.5,
            speed: 0.4 + Math.random() * 0.7,
            phase: Math.random() * Math.PI * 2,
            isAqua: i % 2 === 0
          });
        }
      }
      const mistDt = Math.min(2.5, (this._frameDt || 0.00833) * 60);
      for (let i = 0; i < this._riverMistParticles.length; i++) {
        const mp = this._riverMistParticles[i];
        mp.y -= mp.speed * mistDt;
        mp.x += Math.sin(mp.phase + safePerfNow * 0.002) * 0.55 * mistDt;
        if (mp.y < -10) {
          mp.y = h + 10;
          mp.x = Math.random() * w;
        }
        ctx.fillStyle = mp.isAqua
          ? `rgba(125, 211, 252, ${(0.22 + beatPulse * 0.18).toFixed(2)})`
          : `rgba(110, 231, 183, ${(0.20 + beatPulse * 0.16).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, mp.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // 1. GRADIENTE ATMOSFÉRICO DE ESTADIO SEGÚN MULTIPLICADOR (Con margen anti-artefactos de shake)
    const bgGradIdx = mult >= 5 ? 4 : Math.max(0, mult - 1);
    ctx.fillStyle = (this._bgGrads && this._bgGrads[bgGradIdx]) ? this._bgGrads[bgGradIdx] : '#0e081e';
    ctx.fillRect(-20, -20, w + 40, h + 40);

    // 1b. Fondo personalizado si está activo
    if (this.customBgMode === 'static' && this.customBgMedia) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.05, Math.min(0.9, this.customBgOpacity || 0.40));
      this.drawCoverMedia(ctx, this.customBgMedia, w, h);
      ctx.restore();
    }

    // Intensidades y velocidad según multiplicador (sin blanquear la escena en X4/X5)
    let stageIntensity = 0.65;
    let swingFreq = 0.0011;
    let beamColor1 = palette.spotlight1 || '#9b51e0';
    let beamColor2 = palette.spotlight2 || '#ff5964';

    if (mult === 2) {
      stageIntensity = 0.80;
      swingFreq = 0.0014;
      beamColor1 = '#ffd700';
      beamColor2 = '#ff9900';
    } else if (mult === 3) {
      stageIntensity = 0.90;
      swingFreq = 0.0018;
      beamColor1 = '#ff007f';
      beamColor2 = '#d946ef';
    } else if (mult === 4) {
      stageIntensity = 0.95;
      swingFreq = 0.0020;
      beamColor1 = '#00b4d8';
      beamColor2 = '#7c3aed';
    } else if (mult >= 5) {
      stageIntensity = 1.00;
      swingFreq = 0.0022;
      beamColor1 = '#a855f7';
      beamColor2 = '#ffd700';
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 2. RAYAS DE SINTETIZADOR CON CUADRADITOS (75% hasta arriba, reactivas a teclas)
    const bpmSpeedVal = (this.currentBpm || 120);
    this.renderEqualizerBorders(ctx, w, h, currentTime, bpmSpeedVal, beatPulse, mult);

    // 3. FOCOS ZENITALES MÓVILES VOLUMÉTRICOS (Fase continua monotónica sin saltos)
    // Foco Izquierdo
    const spot1BaseX = w * 0.15;
    const spot1Swing = Math.sin(safePerfNow * swingFreq) * (w * 0.45);
    const spot1TargetX = (w * 0.50) + spot1Swing;
    const spot1TargetY = h * 0.90;

    ctx.fillStyle = hexToRgba(beamColor1, 0.10 * stageIntensity);
    ctx.beginPath();
    ctx.moveTo(spot1BaseX - 30, -10);
    ctx.lineTo(spot1BaseX + 30, -10);
    ctx.lineTo(spot1TargetX + (w * 0.22 * (1 + beatPulse * 0.16)), spot1TargetY);
    ctx.lineTo(spot1TargetX - (w * 0.22 * (1 + beatPulse * 0.16)), spot1TargetY);
    ctx.closePath();
    ctx.fill();

    // Foco Derecho
    const spot2BaseX = w * 0.85;
    const spot2Swing = Math.sin(safePerfNow * swingFreq + 1.4) * (w * 0.45);
    const spot2TargetX = (w * 0.50) - spot2Swing;
    const spot2TargetY = h * 0.90;

    ctx.fillStyle = hexToRgba(beamColor2, 0.10 * stageIntensity);
    ctx.beginPath();
    ctx.moveTo(spot2BaseX - 30, -10);
    ctx.lineTo(spot2BaseX + 30, -10);
    ctx.lineTo(spot2TargetX + (w * 0.22 * (1 + beatPulse * 0.16)), spot2TargetY);
    ctx.lineTo(spot2TargetX - (w * 0.22 * (1 + beatPulse * 0.16)), spot2TargetY);
    ctx.closePath();
    ctx.fill();

    // Focos adicionales en combo alto (3x, 4x, 5x)
    if (mult >= 3) {
      const spot3BaseX = w * 0.50;
      const spot3Swing = Math.cos(safePerfNow * swingFreq * 1.3) * (w * 0.40);
      const spot3TargetX = (w * 0.50) + spot3Swing;
      const spot3TargetY = h * 0.92;

      ctx.fillStyle = hexToRgba(beamColor1, 0.08 * stageIntensity);
      ctx.beginPath();
      ctx.moveTo(spot3BaseX - 20, -10);
      ctx.lineTo(spot3BaseX + 20, -10);
      ctx.lineTo(spot3TargetX + (w * 0.16), spot3TargetY);
      ctx.lineTo(spot3TargetX - (w * 0.16), spot3TargetY);
      ctx.closePath();
      ctx.fill();
    }

    // 5. ESTELAS DE VELOCIDAD HIPERSÓNICAS (Cap a 18 estelas para máximo rendimiento)
    if (mult >= 2) {
      const targetCount = Math.min(18, 10 + mult * 2);
      if (!this.speedStreaks) this.speedStreaks = [];
      while (this.speedStreaks.length < targetCount) {
        this.speedStreaks.push({
          angle: -0.85 + Math.random() * 1.70,
          speed: 1.8 + Math.random() * 2.6,
          progress: Math.random(),
          len: 0.018 + Math.random() * 0.035, // Líneas cortas y electrizantes
          side: Math.random() > 0.5 ? 1 : -1,
          col: Math.random() > 0.45 ? beamColor1 : beamColor2,
          thick: 1.1 + Math.random() * 2.0,
          lateralShift: (Math.random() - 0.5) * 0.25
        });
      }

      const frameScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
      for (let i = 0; i < this.speedStreaks.length; i++) {
        const s = this.speedStreaks[i];
        const warpSpeed = (0.9 + mult * 0.55);
        s.progress += 0.018 * s.speed * warpSpeed * frameScale;
        if (s.progress > 1.0) {
          s.progress = 0;
          s.speed = 1.8 + Math.random() * 2.6;
          s.len = 0.018 + Math.random() * 0.035;
          s.side = Math.random() > 0.5 ? 1 : -1;
          s.col = Math.random() > 0.45 ? beamColor1 : beamColor2;
          s.lateralShift = (Math.random() - 0.5) * 0.25;
        }

        const p1 = s.progress;
        const p2 = Math.min(1.0, p1 + s.len);
        const xCenter = w / 2;
        const yCenter = horizY;

        const startRad = 35 + p1 * (w * 0.88);
        const endRad = 35 + p2 * (w * 0.88);

        const spread1 = 0.44 + 0.56 * p1;
        const x1 = xCenter + s.side * (w * (0.38 + s.lateralShift) + startRad * 0.45) * spread1;
        const y1 = yCenter + Math.pow(p1, 1.35) * h * 0.98;

        const spread2 = 0.44 + 0.56 * p2;
        const x2 = xCenter + s.side * (w * (0.38 + s.lateralShift) + endRad * 0.45) * spread2;
        const y2 = yCenter + Math.pow(p2, 1.35) * h * 0.98;

        const streakAlpha = Math.sin(p1 * Math.PI) * (0.32 + 0.12 * mult) * stageIntensity;
        ctx.strokeStyle = hexToRgba(s.col || beamColor1, streakAlpha);
        ctx.lineWidth = s.thick * (0.7 + 0.4 * p1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Punta incandescente de la estela
        ctx.fillStyle = hexToRgba('#ffffff', streakAlpha * 0.9);
        ctx.beginPath();
        ctx.arc(x2, y2, s.thick * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. MOTAS DE POLVO ESCÉNICO Y DESTELLOS FLOTANTES
    if (!this.stageDustMotes || this.stageDustMotes.length === 0) {
      this.stageDustMotes = [];
      for (let i = 0; i < 28; i++) {
        this.stageDustMotes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.0 + Math.random() * 2.4,
          speed: 0.35 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.15 + Math.random() * 0.35
        });
      }
    }

    const dustScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
    for (let i = 0; i < this.stageDustMotes.length; i++) {
      const m = this.stageDustMotes[i];
      m.y -= m.speed * (mult >= 3 ? 1.5 : 1.0) * dustScale;
      m.x += Math.sin(m.phase + safePerfNow * 0.0016) * 0.5 * dustScale;
      if (m.y < -10) {
        m.y = h + 10;
        m.x = Math.random() * w;
      }
      ctx.fillStyle = hexToRgba(beamColor1, m.alpha * (0.5 + 0.5 * beatPulse));
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. REFLEJOS ESPECULARES EN EL SUELO BAJO LAS NOTAS (Optimizado: empieza en firstActiveNoteIndex y sin RadialGradient por frame)
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    if (Array.isArray(this.notes)) {
      let drawnReflections = 0;
      const startRefIdx = Math.min(this.firstActiveNoteIndex || 0, this.notes.length);
      const scrollDur = this.scrollDurationMs || 1000;
      for (let i = startRefIdx; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (!n || n.consumed || n.hit || n.missed) continue;
        const noteTime = n.timeMs || n.timestamp_ms || 0;
        const diff = noteTime - currentTime;
        if (diff > 500) break;
        if (diff >= -50 && diff <= 500 && drawnReflections < 3) {
          const laneCoord = this.getPerspectiveCoord(n.lane, 1.0 - (diff / scrollDur), this._coordScratch0);
          if (laneCoord && laneCoord.y > hitY * 0.4) {
            drawnReflections++;
            const refAlpha = Math.max(0, Math.min(0.20, (1 - diff / 500) * 0.20));
            ctx.fillStyle = hexToRgba(beamColor1, refAlpha);
            ctx.beginPath();
            ctx.ellipse(laneCoord.x, hitY + 12, laneCoord.laneW * 0.55, 11, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();

    // 7. Full Focus Vignette Ambient Flash (0 Gradient Allocs)
    if (this.vignetteAlpha > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = hexToRgba(this.vignetteColor || beamColor1, this.vignetteAlpha * 0.28);
      ctx.lineWidth = Math.max(18, w * 0.06);
      ctx.strokeRect(0, 0, w, h);
      ctx.restore();
    }

    const isReactiveActive = this.customBgMode === 'reactive' && !!this.customBgMedia;
    if (!isReactiveActive) {
      return;
    }

    try {
      // FONDO REACTIVO: ILUMINACIÓN ADITIVA DINÁMICA
      if (this.customBgMode === 'reactive' && this.customBgMedia) {
        const hasBursts = this.bgBursts.some(b => b.type === 'reactive_reveal' && b.alpha > 0.01);
        const hasHolds = this.activeHolds.size > 0;
        const hasBoost = (this.reactiveLightBoost || 0) > 0.01;

        if (hasBursts || hasHolds || hasBoost) {
          const spotScale = 0.5;
          const spotW = Math.max(160, Math.round(w * spotScale));
          const spotH = Math.max(160, Math.round(h * spotScale));
          if (!this.spotlightCanvas || this.spotlightCanvas.width !== spotW || this.spotlightCanvas.height !== spotH) {
            this.spotlightCanvas = document.createElement('canvas');
            this.spotlightCanvas.width = spotW;
            this.spotlightCanvas.height = spotH;
            this.spotlightCtx = this.spotlightCanvas.getContext('2d');
          }
          const sCtx = this.spotlightCtx;
          sCtx.clearRect(0, 0, spotW, spotH);

          sCtx.save();
          sCtx.scale(spotScale, spotScale);
          sCtx.globalCompositeOperation = 'lighter';

          if (hasBoost) {
            const ambGrad = sCtx.createRadialGradient(w / 2, this.hitLineY, 20, w / 2, this.hitLineY, Math.max(w, h));
            const boostA = Math.min(0.70, (this.reactiveLightBoost || 0) * 0.70);
            ambGrad.addColorStop(0, `rgba(255, 255, 255, ${boostA.toFixed(3)})`);
            ambGrad.addColorStop(0.5, `rgba(255, 255, 255, ${(boostA * 0.45).toFixed(3)})`);
            ambGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            sCtx.fillStyle = ambGrad;
            sCtx.fillRect(0, 0, w, h);
          }

          for (const b of this.bgBursts) {
            if (b.type !== 'reactive_reveal' || b.alpha <= 0.01) continue;
            const rad = Math.max(20, b.radius);
            const grad = sCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
            const a = Math.min(1.0, b.alpha);
            grad.addColorStop(0, `rgba(255, 255, 255, ${a.toFixed(3)})`);
            grad.addColorStop(0.35, `rgba(255, 255, 255, ${(a * 0.85).toFixed(3)})`);
            grad.addColorStop(0.70, `rgba(255, 255, 255, ${(a * 0.40).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            sCtx.fillStyle = grad;
            sCtx.beginPath();
            sCtx.arc(b.x, b.y, rad, 0, Math.PI * 2);
            sCtx.fill();
          }

          for (const [holdLane] of this.activeHolds.entries()) {
            const hx = (holdLane + 0.5) * this.laneWidth;
            const hy = this.hitLineY;
            const hRad = this.laneWidth * 1.8;
            const grad = sCtx.createRadialGradient(hx, hy, 0, hx, hy, hRad);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.60)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            sCtx.fillStyle = grad;
            sCtx.beginPath();
            sCtx.arc(hx, hy, hRad, 0, Math.PI * 2);
            sCtx.fill();
          }
          sCtx.restore();

          sCtx.save();
          sCtx.globalCompositeOperation = 'source-in';
          sCtx.scale(spotScale, spotScale);
          this.drawCoverMedia(sCtx, this.customBgMedia, w, h);
          sCtx.restore();

          ctx.save();
          ctx.drawImage(this.spotlightCanvas, 0, 0, w, h);
          ctx.restore();
        }
      }
    } catch (fxErr) {
      console.warn('Background FX warning:', fxErr);
    }
  }

  // =========================================================================
  // MOTOR DE 12 EFECTOS ORIGINALES DE ALTA GAMA (VISIBLES SOBRE PISTA Y CÁPSULA)
  // =========================================================================
  static drawSingleEffectBurst(ctx, b, nowMs = 0, spanScale = 1.0) {
    if (!ctx || !b || b.alpha <= 0.01) return;
    const isRiverBurst = (b.type === 'river_splash') || (typeof window !== 'undefined' && window.isRiverModeActive);
    const fx = isRiverBurst ? 'river_splash' : (b.type || 'solar_inferno');
    const a = Math.max(0, Math.min(1, b.alpha));
    const p = Math.max(0, Math.min(1, 1 - a));
    const x = b.x;
    const y = b.y;
    const s = spanScale;
    const seed = b.seed || 17.3;

    ctx.save();

    // 0. SALPICADURA ACUÁTICA Y CORONA DE ONDAS DE RÍO (Exclusivo Modo Río)
    if (fx === 'river_splash') {
      // Triple anillo de onda de agua concéntrica en perspectiva 3D
      for (let rIdx = 0; rIdx < 3; rIdx++) {
        const rp = Math.max(0, Math.min(1, p * 1.15 - rIdx * 0.14));
        if (rp <= 0.01) continue;
        const rx = (18 + rp * (72 - rIdx * 12)) * s;
        const ry = rx * 0.42;
        const ringAlpha = a * (1 - rp * 0.65) * (rIdx === 0 ? 0.92 : 0.68);
        ctx.strokeStyle = rIdx === 0 ? `rgba(255, 255, 255, ${ringAlpha.toFixed(3)})` : (rIdx === 1 ? `rgba(0, 242, 254, ${ringAlpha.toFixed(3)})` : `rgba(56, 189, 248, ${ringAlpha.toFixed(3)})`);
        ctx.lineWidth = Math.max(1.2, (3.6 - rIdx * 0.8) * s * a);
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Corona de salpicadura líquida ascendente (Water Crown Jets)
      const crownSpikes = 7;
      ctx.fillStyle = `rgba(186, 230, 253, ${(a * 0.72).toFixed(3)})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.92).toFixed(3)})`;
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      for (let k = 0; k < crownSpikes; k++) {
        const frac = (k / (crownSpikes - 1)) - 0.5;
        const baseX = x + frac * (34 + p * 44) * s;
        const tipX = x + frac * (56 + p * 82) * s;
        const archLift = Math.sin(Math.min(1, p * 1.45) * Math.PI);
        const jetH = (26 + (1 - Math.abs(frac)) * 38) * archLift * s;
        const tipY = y - jetH;
        ctx.moveTo(baseX - 4 * s * a, y);
        ctx.quadraticCurveTo((baseX + tipX) * 0.5, tipY + 6 * s, tipX, tipY);
        ctx.quadraticCurveTo((baseX + tipX) * 0.5, tipY + 10 * s, baseX + 4 * s * a, y);
      }
      ctx.fill();
      ctx.stroke();

      // Gotas cristalinas desprendiéndose de las puntas de la corona de agua
      for (let d = 0; d < 9; d++) {
        const frac = (d / 8) - 0.5;
        const dx = x + frac * (64 + p * 98) * s + Math.sin(seed + d * 1.9) * 6 * s;
        const dy = y - (Math.sin(Math.min(1, p * 1.25) * Math.PI) * (42 + (d % 3) * 18) - p * p * 28) * s;
        const dropR = (3.4 - (d % 3) * 0.6) * s * a;
        ctx.fillStyle = (d % 2 === 0) ? '#ffffff' : '#7dd3fc';
        ctx.beginPath();
        ctx.arc(dx, dy, Math.max(1.0, dropR), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // 1. LLAMARADA INFERNAL (FUEGO VOLUMÉTRICO INTENSO - 0 Gradient Allocs)
    if (fx === 'solar_inferno') {
      ctx.fillStyle = `rgba(234, 88, 12, ${(a * 0.38).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y - 35 * s * p, 62 * s, 90 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      const flameCols = ['#dc2626', '#ff4500', '#fb923c', '#fde047', '#ffffff'];
      ctx.fillStyle = '#ff5500';
      ctx.globalAlpha = a * 0.85;
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const frac = i / 6;
        const spread = (frac - 0.5) * 76 * s;
        const flameH = (85 + Math.sin(seed + i * 2.1) * 35 + p * 145) * s;
        const wave = Math.sin(nowMs * 0.018 + i * 1.4) * 16 * s;
        const topX = x + spread * (0.55 + p * 0.45) + wave;
        const topY = y - flameH;
        const baseW = (24 - (i % 3) * 4) * s * a;

        ctx.moveTo(x + spread * 0.35 - baseW, y + 6 * s);
        ctx.quadraticCurveTo(x + spread * 0.7 - wave * 0.6, y - flameH * 0.5, topX, topY);
        ctx.quadraticCurveTo(x + spread * 0.7 + wave * 0.6, y - flameH * 0.5, x + spread * 0.35 + baseW, y + 6 * s);
      }
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.globalAlpha = a * 0.90;
      ctx.beginPath();
      for (let i = 1; i < 6; i++) {
        const frac = i / 6;
        const spread = (frac - 0.5) * 52 * s;
        const flameH = (52 + Math.sin(seed + i * 2.1) * 22 + p * 95) * s;
        const wave = Math.sin(nowMs * 0.018 + i * 1.4) * 10 * s;
        const topX = x + spread * 0.5 + wave;
        const topY = y - flameH;
        const baseW = 12 * s * a;
        ctx.moveTo(x + spread * 0.25 - baseW, y + 4 * s);
        ctx.lineTo(topX, topY);
        ctx.lineTo(x + spread * 0.25 + baseW, y + 4 * s);
      }
      ctx.fill();

      ctx.strokeStyle = '#ff4500';
      ctx.lineWidth = 4.5 * s * a;
      ctx.beginPath();
      ctx.ellipse(x, y, (24 + p * 68) * s, (10 + p * 26) * s, 0, 0, Math.PI * 2);
      ctx.stroke();

      for (let e = 0; e < 8; e++) {
        const ang = seed + e * 0.9 + p * 3.5;
        const ex = x + Math.sin(ang) * (15 + e * 5.5) * s;
        const ey = y - (p * (60 + e * 16) + (e * 7)) * s;
        ctx.fillStyle = flameCols[e % flameCols.length];
        ctx.beginPath();
        ctx.arc(ex, ey, (3.6 - (e % 3) * 0.7) * s * a, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. VENTISCA CRIOGÉNICA (CRISTALES DE HIELO Y ESCARCHA - 0 Gradient Allocs)
    else if (fx === 'cryo_blizzard') {
      ctx.fillStyle = `rgba(14, 165, 233, ${(a * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 76 * s, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 9; i++) {
        const ang = -Math.PI * 0.88 + (i / 8) * Math.PI * 0.76;
        const len = (42 + (i % 2) * 32 + p * 68) * s;
        const tipX = x + Math.cos(ang) * len;
        const tipY = y + Math.sin(ang) * len;
        const perpX = -Math.sin(ang) * 9 * s * a;
        const perpY = Math.cos(ang) * 9 * s * a;

        ctx.beginPath();
        ctx.moveTo(x + perpX, y + perpY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(x - perpX, y - perpY);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? `rgba(2, 132, 199, ${(a * 0.85).toFixed(3)})` : `rgba(56, 189, 248, ${(a * 0.88).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.95).toFixed(3)})`;
        ctx.lineWidth = 1.6 * s;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(x, y - 28 * p * s);
      ctx.rotate(p * 1.4 + seed);
      const hexR = (22 + p * 54) * s;
      ctx.strokeStyle = `rgba(224, 242, 254, ${(a * 0.95).toFixed(3)})`;
      ctx.lineWidth = 2.6 * s * a;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ka = (k * Math.PI) / 3;
        const kx = Math.cos(ka) * hexR;
        const ky = Math.sin(ka) * hexR;
        ctx.moveTo(0, 0);
        ctx.lineTo(kx, ky);
        const b1x = Math.cos(ka) * hexR * 0.62;
        const b1y = Math.sin(ka) * hexR * 0.62;
        ctx.moveTo(b1x, b1y);
        ctx.lineTo(b1x + Math.cos(ka + 0.6) * hexR * 0.28, b1y + Math.sin(ka + 0.6) * hexR * 0.28);
        ctx.moveTo(b1x, b1y);
        ctx.lineTo(b1x + Math.cos(ka - 0.6) * hexR * 0.28, b1y + Math.sin(ka - 0.6) * hexR * 0.28);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. PULSO CYBERPUNK (EFECTO NEÓN SYNTHWAVE - 0 Gradient Allocs)
    else if (fx === 'cyber_neon') {
      const neonCols = ['#ff007f', '#00f2fe', '#a855f7', '#ffe600'];
      const beamH = (120 + p * 180) * s;
      ctx.fillStyle = `rgba(255, 0, 127, ${(a * 0.42).toFixed(3)})`;
      ctx.fillRect(x - 34 * s * a, y - beamH * 0.65, 68 * s * a, beamH * 0.65);
      ctx.fillStyle = `rgba(0, 242, 254, ${(a * 0.32).toFixed(3)})`;
      ctx.fillRect(x - 20 * s * a, y - beamH, 40 * s * a, beamH);

      for (let hIdx = 0; hIdx < 3; hIdx++) {
        ctx.save();
        ctx.translate(x, y - hIdx * 24 * p * s);
        ctx.rotate((hIdx % 2 === 0 ? 1 : -1) * (p * 2.5 + hIdx));
        ctx.scale(1, 0.62);
        const rad = (20 + hIdx * 18 + p * 52) * s;
        ctx.beginPath();
        for (let v = 0; v < 6; v++) {
          const va = (v * Math.PI) / 3;
          if (v === 0) ctx.moveTo(Math.cos(va) * rad, Math.sin(va) * rad);
          else ctx.lineTo(Math.cos(va) * rad, Math.sin(va) * rad);
        }
        ctx.closePath();
        ctx.strokeStyle = neonCols[hIdx % neonCols.length];
        ctx.lineWidth = (4.0 - hIdx * 0.8) * s * a;
        ctx.stroke();
        ctx.restore();
      }

      for (let g = 0; g < 6; g++) {
        const gy = y - (g * 26 + p * 65) * s;
        const gw = (35 + ((g * 19) % 45)) * s * a;
        const gx = x + Math.sin(seed + g * 2.3 + p * 8) * 28 * s;
        ctx.fillStyle = neonCols[g % neonCols.length];
        ctx.globalAlpha = a * 0.90;
        ctx.fillRect(gx - gw * 0.5, gy, gw, 3.5 * s);
      }
    }

    // 4. PIROTECNIA IMPERIAL (FUEGOS ARTIFICIALES MULTICOLOR)
    else if (fx === 'grand_fireworks') {
      const shells = [
        { ox: 0, oy: -68 * s, col1: '#ff0055', col2: '#ffd700', r: 72 * s },
        { ox: -36 * s, oy: -105 * s, col1: '#00f2fe', col2: '#39ff14', r: 54 * s },
        { ox: 38 * s, oy: -96 * s, col1: '#a855f7', col2: '#fde047', r: 56 * s }
      ];
      for (let sIdx = 0; sIdx < shells.length; sIdx++) {
        const sh = shells[sIdx];
        const cx = x + sh.ox * (0.4 + p * 0.6);
        const cy = y + sh.oy * (0.35 + p * 0.65);

        ctx.fillStyle = `rgba(15, 6, 30, ${(a * 0.45).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, sh.r * (0.3 + p * 0.7), 0, Math.PI * 2);
        ctx.fill();

        const spokes = 12;
        ctx.strokeStyle = sh.col1;
        ctx.lineWidth = 2.5 * s * a;
        ctx.beginPath();
        for (let k = 0; k < spokes; k++) {
          const ang = (k / spokes) * Math.PI * 2 + sIdx * 0.3;
          const dist = sh.r * (0.18 + p * 0.85);
          const droop = p * p * 26 * s;
          const tx = cx + Math.cos(ang) * dist;
          const ty = cy + Math.sin(ang) * dist + droop;
          ctx.moveTo(cx + Math.cos(ang) * dist * 0.25, cy + Math.sin(ang) * dist * 0.25);
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let k = 0; k < spokes; k++) {
          const ang = (k / spokes) * Math.PI * 2 + sIdx * 0.3;
          const dist = sh.r * (0.18 + p * 0.85);
          const droop = p * p * 26 * s;
          const tx = cx + Math.cos(ang) * dist;
          const ty = cy + Math.sin(ang) * dist + droop;
          ctx.moveTo(tx + 2.6 * s * a, ty);
          ctx.arc(tx, ty, 2.6 * s * a, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    // 5. TORMENTA DE ZEUS (ILUMINACIONES Y RAYOS TESLA - 0 Gradient Allocs)
    else if (fx === 'zeus_lightning') {
      const stormH = 220 * s;
      ctx.fillStyle = `rgba(124, 58, 237, ${(a * 0.35).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y - stormH * 0.45, 48 * s, stormH * 0.50, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let bIdx = 0; bIdx < 3; bIdx++) {
        const startX = x + (bIdx - 1) * 34 * s;
        const startY = y - (170 + bIdx * 28) * s;
        const segments = 7;

        ctx.strokeStyle = bIdx === 1 ? '#00f2fe' : '#a855f7';
        ctx.lineWidth = (7.0 - bIdx * 1.5) * s * a;
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let seg = 1; seg < segments; seg++) {
          const frac = seg / segments;
          const jx = startX + (x - startX) * frac + Math.sin(nowMs * 0.045 + seg * 3.7 + bIdx * 2.1) * 24 * s;
          const jy = startY + (y - startY) * frac;
          ctx.lineTo(jx, jy);
        }
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * s * a;
        ctx.stroke();
      }

      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3.2 * s * a;
      ctx.beginPath();
      ctx.ellipse(x, y, (28 + p * 64) * s, (12 + p * 26) * s, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6. NEBULOSA CÓSMICA (EFECTO DEL ESPACIO Y GALAXIA - 0 Gradient Allocs)
    else if (fx === 'deep_cosmos') {
      const cy = y - 28 * p * s;
      const maxR = (42 + p * 54) * s;

      ctx.fillStyle = `rgba(88, 28, 135, ${(a * 0.62).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, maxR, maxR * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(219, 39, 119, ${(a * 0.38).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, maxR * 0.65, maxR * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();

      const armCols = ['#38bdf8', '#f472b6', '#fde047', '#c084fc', '#ffffff'];
      for (let i = 0; i < 20; i++) {
        const arm = i % 2;
        const t = i / 20;
        const theta = arm * Math.PI + t * Math.PI * 3.2 - p * 4.2 + seed;
        const r = t * maxR * 0.88;
        const sx = x + Math.cos(theta) * r;
        const sy = cy + Math.sin(theta) * r * 0.68;
        ctx.fillStyle = armCols[i % armCols.length];
        const sr = (1.8 + (1 - t) * 2.8) * s * a;
        ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
      }

      const pAng = seed + p * 3.8;
      const px = x + Math.cos(pAng) * maxR * 0.52;
      const py = cy + Math.sin(pAng) * maxR * 0.34;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 7.5 * s * a, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.2 * s * a;
      ctx.beginPath();
      ctx.ellipse(px, py, 15 * s * a, 4.5 * s * a, -0.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 7. LLUVIA DE ASTEROIDES (METEORITOS EN LLAMAS E IMPACTO - 0 Gradient Allocs)
    else if (fx === 'asteroid_impact') {
      const craterR = (28 + p * 58) * s;
      ctx.fillStyle = `rgba(234, 88, 12, ${(a * 0.65).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, craterR, craterR * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(254, 240, 138, ${(a * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, craterR * 0.45, craterR * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let m = 0; m < 6; m++) {
        const ang = -Math.PI * 0.82 + (m / 5) * Math.PI * 0.64;
        const dist = (18 + p * (72 + (m % 3) * 28)) * s;
        const rx = x + Math.cos(ang) * dist;
        const ry = y + Math.sin(ang) * dist + p * p * 34 * s;
        const rockR = (8.5 - (m % 3) * 1.8) * s * a;

        ctx.strokeStyle = `rgba(249, 115, 22, ${(a * 0.75).toFixed(3)})`;
        ctx.lineWidth = rockR * 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(rx, ry);
        ctx.stroke();

        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(seed + m + p * 6);
        ctx.beginPath();
        for (let v = 0; v < 7; v++) {
          const va = (v / 7) * Math.PI * 2;
          const vr = rockR * (v % 2 === 0 ? 1.15 : 0.78);
          if (v === 0) ctx.moveTo(Math.cos(va) * vr, Math.sin(va) * vr);
          else ctx.lineTo(Math.cos(va) * vr, Math.sin(va) * vr);
        }
        ctx.closePath();
        ctx.fillStyle = '#292524';
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8 * s;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 8. HORIZONTE DE SUCESOS (AGUJERO NEGRO GRAVITACIONAL - 0 Gradient Allocs)
    else if (fx === 'black_hole') {
      const cy = y - 18 * p * s;
      const diskR = (38 + p * 52) * s;

      ctx.fillStyle = `rgba(219, 39, 119, ${(a * 0.55).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, diskR, diskR * 0.52, -0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(249, 115, 22, ${(a * 0.78).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, diskR * 0.65, diskR * 0.34, -0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(56, 189, 248, ${(a * 0.75).toFixed(3)})`;
      ctx.lineWidth = 5 * s * a;
      ctx.beginPath();
      ctx.moveTo(x, cy - diskR * 1.45);
      ctx.lineTo(x, cy + diskR * 0.85);
      ctx.stroke();

      const coreR = (18 + (1 - p) * 8) * s * a;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.8 * s * a;
      ctx.stroke();
    }

    // 9. LLAMA DE DRAGÓN ESMERALDA (DOBLE HÉLICE DE FUEGO MÍSTICO - 0 Gradient Allocs)
    else if (fx === 'dragon_fire') {
      const hMax = (110 + p * 160) * s;
      ctx.fillStyle = `rgba(16, 185, 129, ${(a * 0.36).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y - hMax * 0.35, 54 * s, 84 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        for (let step = 0; step <= 14; step++) {
          const f = step / 14;
          const angle = f * Math.PI * 3.5 + p * 7.0 + strand * Math.PI;
          const hx = x + Math.sin(angle) * (28 * (1 - f * 0.45)) * s;
          const hy = y - f * hMax;
          if (step === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.strokeStyle = strand === 0 ? '#10b981' : '#fde047';
        ctx.lineWidth = 7.5 * s * a;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * s * a;
        ctx.stroke();
      }
    }

    // 10. AURORA BOREAL CELESTIAL (CORTINAS DE LUZ PRISMÁTICA - 0 Gradient Allocs)
    else if (fx === 'aurora_borealis') {
      const ribbons = [
        { col: '#06b6d4', off: -32 },
        { col: '#10b981', off: -10 },
        { col: '#8b5cf6', off: 12 },
        { col: '#f43f5e', off: 34 }
      ];
      const curH = (125 + p * 135) * s;
      ctx.globalAlpha = a * 0.72;
      for (let r = 0; r < ribbons.length; r++) {
        const rb = ribbons[r];
        const wave = Math.sin(nowMs * 0.008 + r * 1.4 + p * 4) * 18 * s;
        const rx = x + rb.off * s + wave;
        ctx.fillStyle = rb.col;
        ctx.beginPath();
        ctx.moveTo(rx - 14 * s, y);
        ctx.quadraticCurveTo(rx + wave, y - curH * 0.5, rx - 6 * s, y - curH);
        ctx.lineTo(rx + 14 * s, y - curH);
        ctx.quadraticCurveTo(rx + wave + 14 * s, y - curH * 0.5, rx + 14 * s, y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 11. EXPLOSIÓN SUPERNOVA (ESTRELLA HIPERMASIVA - 0 Gradient Allocs)
    else if (fx === 'supernova_burst') {
      const cy = y - 16 * p * s;
      const rad = (45 + p * 75) * s;

      ctx.fillStyle = `rgba(255, 0, 127, ${(a * 0.45).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(253, 224, 71, ${(a * 0.78).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, cy, rad * 0.55, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(p * 0.8);
      for (let sp = 0; sp < 8; sp++) {
        ctx.save();
        ctx.rotate((sp * Math.PI) / 4);
        const spikeLen = (sp % 2 === 0 ? rad * 1.45 : rad * 0.88);
        ctx.fillStyle = sp % 2 === 0 ? '#ffffff' : '#fde047';
        ctx.globalAlpha = a * 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -4.5 * s);
        ctx.lineTo(spikeLen, 0);
        ctx.lineTo(0, 4.5 * s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // 12. MATRIZ HIPER-CUÁNTICA (HIPERCUBOS 3D Y LÁSER)
    else if (fx === 'quantum_prism') {
      const cy = y - 35 * p * s;
      const scanY = y - p * 175 * s;
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 3.5 * s * a;
      ctx.beginPath();
      ctx.moveTo(x - 48 * s, scanY);
      ctx.lineTo(x + 48 * s, scanY);
      ctx.stroke();

      for (let c = 0; c < 2; c++) {
        const sz = (24 + c * 18 + p * 32) * s;
        ctx.save();
        ctx.translate(x, cy);
        ctx.rotate((c === 0 ? 1 : -1) * (p * 3.2 + seed));
        ctx.strokeStyle = c === 0 ? '#00f2fe' : '#a855f7';
        ctx.lineWidth = 3.0 * s * a;
        ctx.strokeRect(-sz * 0.5, -sz * 0.5, sz, sz);
        ctx.fillStyle = c === 0 ? `rgba(0, 242, 254, ${(a * 0.22).toFixed(3)})` : `rgba(168, 85, 247, ${(a * 0.18).toFixed(3)})`;
        ctx.fillRect(-sz * 0.5, -sz * 0.5, sz, sz);
        ctx.restore();
      }
    }

    // 13. SINGULARIDAD ASTRAL: SERAFÍN DEL CRONO (CALIDAD TRASCENDENTAL - 0 Gradient Allocs, 120 FPS)
    else if (fx === 'astral_transcendence') {
      const pillarH = (165 + p * 185) * s;

      // A. Pilar Catedralicio Prismático (3 haces concéntricos: Magenta -> Cian -> Oro Blanco)
      ctx.fillStyle = `rgba(255, 0, 127, ${(a * 0.26).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(x - 46 * s * a, y);
      ctx.lineTo(x - 16 * s * a, y - pillarH);
      ctx.lineTo(x + 16 * s * a, y - pillarH);
      ctx.lineTo(x + 46 * s * a, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(0, 242, 254, ${(a * 0.38).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(x - 28 * s * a, y);
      ctx.lineTo(x - 8 * s * a, y - pillarH * 1.08);
      ctx.lineTo(x + 8 * s * a, y - pillarH * 1.08);
      ctx.lineTo(x + 28 * s * a, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(253, 224, 71, ${(a * 0.68).toFixed(3)})`;
      ctx.fillRect(x - 7 * s * a, y - pillarH * 0.95, 14 * s * a, pillarH * 0.95);

      // B. 6 Alas de Serafín Desplegándose Simétricamente desde el Punto de Impacto
      const wingCols = ['#fde047', '#00f2fe', '#ff007f'];
      for (let pair = 0; pair < 3; pair++) {
        const wingSpan = (48 + pair * 24 + p * (72 + pair * 18)) * s;
        const wingLift = (32 + pair * 28 + p * (55 + pair * 22)) * s;
        ctx.fillStyle = wingCols[pair];
        ctx.globalAlpha = a * (0.88 - pair * 0.16);
        ctx.beginPath();
        for (let dir = -1; dir <= 1; dir += 2) {
          const tipX = x + dir * wingSpan;
          const tipY = y - wingLift;
          const ctrlX1 = x + dir * wingSpan * 0.42;
          const ctrlY1 = y - wingLift * 1.18;
          const ctrlX2 = x + dir * wingSpan * 0.58;
          const ctrlY2 = y - wingLift * 0.28;
          ctx.moveTo(x, y - pair * 8 * s);
          ctx.quadraticCurveTo(ctrlX1, ctrlY1, tipX, tipY);
          ctx.quadraticCurveTo(ctrlX2, ctrlY2, x, y + 4 * s - pair * 6 * s);
        }
        ctx.closePath();
        ctx.fill();
      }

      // C. Doble Astrolabio Giroscópico Sagrado en Perspectiva 3D sobre la Pista
      for (let ringIdx = 0; ringIdx < 2; ringIdx++) {
        const rx = (30 + ringIdx * 22 + p * (68 + ringIdx * 24)) * s;
        const ry = rx * 0.44;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.44);
        ctx.rotate((ringIdx === 0 ? 1 : -1) * (nowMs * 0.004 + p * 3.6 + seed));
        ctx.strokeStyle = ringIdx === 0 ? '#fde047' : '#00f2fe';
        ctx.lineWidth = (4.2 - ringIdx * 1.2) * s * a;
        ctx.globalAlpha = a * 0.95;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.stroke();

        // Estrella octogonal inscrita en el astrolabio
        const sq = rx * 0.707;
        ctx.lineWidth = 2.0 * s * a;
        ctx.strokeRect(-sq, -sq, sq * 2, sq * 2);
        ctx.rotate(Math.PI / 4);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(-sq, -sq, sq * 2, sq * 2);
        ctx.restore();
      }

      // D. Corona de Relojería Astral y Estrella de 8 Puntas Ascendente
      const crownY = y - (24 + p * 92) * s;
      const starR = (26 + (1 - p) * 20) * s;
      ctx.save();
      ctx.translate(x, crownY);
      ctx.rotate(-p * 2.4 + seed);
      ctx.globalAlpha = a;
      for (let sp = 0; sp < 8; sp++) {
        ctx.save();
        ctx.rotate((sp * Math.PI) / 4);
        const len = (sp % 2 === 0) ? starR * 1.45 : starR * 0.85;
        ctx.fillStyle = (sp % 2 === 0) ? '#ffffff' : (sp % 4 === 1 ? '#00f2fe' : '#fde047');
        ctx.beginPath();
        ctx.moveTo(0, -3.5 * s);
        ctx.lineTo(len, 0);
        ctx.lineTo(0, 3.5 * s);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  renderForegroundEffectBursts(ctx, currentTime) {
    if (!this.bgBursts || this.bgBursts.length === 0 || !ctx) return;
    const nowMs = this._frameNow || performance.now();
    for (let i = 0; i < this.bgBursts.length; i++) {
      const b = this.bgBursts[i];
      if (!b || b.type === 'reactive_reveal' || b.alpha <= 0.01) continue;
      BeatstarEngine.drawSingleEffectBurst(ctx, b, nowMs, 1.0);
    }
  }

  render(frameNow) {
    this._frameNow = frameNow || performance.now();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1.0;
    this.ctx.shadowBlur = 0;

    // ⚡ TIEMPO BLOQUEADO AL FRAME: Un solo valor inmutable para todo el frame
    const currentTime = this.getCurrentGameTimeMs(this._frameNow);
    const isMushActive = Boolean(this.isMushroomModeActive || (typeof window !== 'undefined' && window.isMushroomModeActive));

    const hasMineShake = (this._mineShakeIntensity && this._mineShakeIntensity > 0.15);
    if (hasMineShake) {
      this.ctx.save();
      const sMag = this._mineShakeIntensity;
      const sx = (Math.random() - 0.5) * 2.0 * sMag;
      const sy = (Math.random() - 0.5) * 2.0 * sMag;
      this.ctx.translate(sx, sy);
    }

    this.renderBackgroundFX(currentTime);
    if (isMushActive) {
      this._beginMushroomWorldTransform(this.ctx, currentTime);
    }
    this.renderLanes(currentTime);
    this.renderHitLine(currentTime);
    this.renderRipples(this.ctx);
    this.renderForegroundEffectBursts(this.ctx, currentTime);
    this.renderNotes(currentTime);
    this.renderSwipeLaunches(this.ctx, currentTime);
    this.particles.render(this.ctx);
    this.renderMusicalNotes();
    if (isMushActive) {
      this._endMushroomWorldTransform(this.ctx);
      this.renderMushroomModeOverlay(this.ctx, currentTime);
    }
    if (this.isStormModeActive || (typeof window !== 'undefined' && window.isStormModeActive)) {
      this.renderStormModeOverlay(this.ctx, currentTime);
    }
    if (this.isHighwayModeActive || (typeof window !== 'undefined' && window.isHighwayModeActive)) {
      this.renderHighwayModeOverlay(this.ctx, currentTime);
    }
    if (this.isAnnoyingDogModeActive || (typeof window !== 'undefined' && window.isAnnoyingDogModeActive)) {
      this.renderAnnoyingDogModeOverlay(this.ctx, currentTime);
    }
    if (this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive)) {
      this.renderRiverModeOverlay(this.ctx, currentTime);
    }
    if (this.isMinesweeperModeActive || (typeof window !== 'undefined' && window.isMinesweeperModeActive) || (this._mineExplosions && this._mineExplosions.length > 0)) {
      this.renderMinesweeperOverlay(this.ctx, currentTime);
    }
    if (this.isMirrorModeActive || (typeof window !== 'undefined' && window.isMirrorModeActive)) {
      this.renderMirrorModeOverlay(this.ctx, currentTime);
    }
    if (this.isEchoModeActive || (typeof window !== 'undefined' && window.isEchoModeActive)) {
      this.renderEchoModeOverlay(this.ctx, currentTime);
    }
    if (hasMineShake) {
      this.ctx.restore();
    }
    this.renderJudgements();
    this.renderFlyingLyrics(this.ctx, currentTime);
    this.renderDiscoLighting(this.ctx, currentTime);
    this.renderDiscoBall(this.ctx, currentTime);
    this.render3DComboExplosion(this.ctx);
    this.renderMissFailureFeedback(this.ctx, currentTime);
  }

  renderSwipeLaunches(ctx, currentTime) {
    if (!this.activeSwipeLaunches || this.activeSwipeLaunches.length === 0) return;
    const now = this._frameNow || performance.now();
    const isLarge = this.keyStyle === 'beatstar_large';

    for (let i = this.activeSwipeLaunches.length - 1; i >= 0; i--) {
      const launch = this.activeSwipeLaunches[i];
      const elapsed = now - launch.startTime;
      if (elapsed > launch.duration) {
        this.activeSwipeLaunches.splice(i, 1);
        continue;
      }

      const progress = Math.max(0, Math.min(1, elapsed / launch.duration)); // 0 to 1
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const easeInCubic = progress * progress * progress;

      // Trayectoria de eyección balística hacia la dirección del deslizamiento
      const curX = launch.x + (launch.vx * (elapsed / 1000));
      const curY = launch.y + (launch.vy * (elapsed / 1000));
      const curScale = Math.max(0.25, (1.0 + progress * 0.45) * (1.0 - easeInCubic * 0.6));
      const curAlpha = Math.max(0, 1.0 - Math.pow(progress, 1.5));
      const curRot = launch.rot * progress * 2.8;

      ctx.save();
      ctx.globalAlpha = curAlpha;
      ctx.translate(curX, curY);
      ctx.rotate(curRot);
      ctx.scale(curScale, curScale);

      const keyW = (this.laneWidth || 100) * 0.78;
      const keyH = isLarge ? 58 : 30;

      const isRiverSwipe = Boolean(this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive));

      // 1. Estela de propulsión luminosa o estela de espuma de agua en Modo Río
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const trailLenX = -launch.vx * 0.05;
      const trailLenY = -launch.vy * 0.05;
      ctx.fillStyle = isRiverSwipe ? 'rgba(56, 189, 248, 0.72)' : hexToRgba(launch.color, 0.72);
      ctx.beginPath();
      ctx.moveTo(-keyW / 2, -keyH / 2);
      ctx.lineTo(keyW / 2, -keyH / 2);
      ctx.lineTo((keyW / 4) + trailLenX, trailLenY);
      ctx.lineTo((-keyW / 4) + trailLenX, trailLenY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Tecla marfil en 3D o Baldosa de Roca de Río saliendo proyectada
      ctx.fillStyle = isRiverSwipe ? '#475569' : '#e8edf4';
      ctx.strokeStyle = isRiverSwipe ? '#7dd3fc' : '#ffffff';
      ctx.lineWidth = 2.4;

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-keyW / 2, -keyH / 2, keyW, keyH, 8);
      else ctx.rect(-keyW / 2, -keyH / 2, keyW, keyH);
      ctx.fill();
      ctx.stroke();

      // Halo de propulsión luminoso en hardware puro
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = isRiverSwipe ? `rgba(0, 242, 254, ${((1 - progress) * 0.90).toFixed(2)})` : hexToRgba(launch.color, (1 - progress) * 0.85);
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-keyW / 2, -keyH / 2, keyW, keyH, 8);
      else ctx.rect(-keyW / 2, -keyH / 2, keyW, keyH);
      ctx.stroke();
      ctx.restore();

      // 3. Chevrón vectorial brillante de la dirección
      this.renderVectorChevron(ctx, 0, 0, launch.dir, keyW, keyH);

      ctx.restore();
    }
  }



  renderFlyingLyrics(ctx, currentTime) {
    if (!this.flyingLyrics || this.flyingLyrics.length === 0) return;
    const now = this._frameNow || performance.now();

    for (let i = this.flyingLyrics.length - 1; i >= 0; i--) {
      const fly = this.flyingLyrics[i];
      const elapsed = now - fly.startTime;
      const t = elapsed / fly.duration;

      if (t >= 1.0) {
        // Al impactar, ilumina la sílaba en el DOM una sola vez
        if (Number.isFinite(fly.sylTime)) {
          if (typeof iluminarSilaba === 'function') iluminarSilaba(fly.sylTime);
          else if (typeof window.iluminarSilaba === 'function') window.iluminarSilaba(fly.sylTime);
        }
        this.flyingLyrics.splice(i, 1);
        continue;
      }

      // Parábola fluida ease-out
      const p = 1.0 - Math.pow(1.0 - t, 3);
      const inv = 1.0 - p;
      const curX = inv * inv * fly.startX + 2 * inv * p * fly.ctrlX + p * p * fly.targetX;
      const curY = inv * inv * fly.startY + 2 * inv * p * fly.ctrlY + p * p * fly.targetY;

      ctx.save();
      ctx.translate(curX, curY);

      // Sombra sólida negra de contraste
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(fly.text, 1.5, 1.5);

      // Núcleo de oro brillante
      ctx.fillStyle = '#ffd700';
      ctx.fillText(fly.text, 0, 0);

      ctx.restore();
    }
  }  render3DComboExplosion(ctx) {
    if (!this.combo3DExplosions || this.combo3DExplosions.length === 0) return;
    const explosions = this.combo3DExplosions;

    for (const exp of explosions) {
      if (!exp || exp.alpha <= 0.01) continue;
      const w = this.width;
      const h = this.height;
      const midX = exp.originX || (w / 2);
      const topY = Math.max(120, Math.min(210, h * 0.18));
      const expAlpha = Math.max(0, Math.min(1, exp.alpha));
      const col = exp.color || '#ffd700';
      const rgb = hexToRgb(col);

      ctx.save();

      // Partículas discretas sin nebulosa ni rayos blancos que blanqueen la pista
      if (exp.sparks && exp.sparks.length > 0) {
        ctx.save();
        for (const sp of exp.sparks) {
          if (sp.alpha <= 0.01) continue;
          const zScale = Math.max(0.3, 1.0 + (sp.z / 260));
          const pRad = Math.max(1.5, sp.radius * zScale * 1.2);
          const pAlpha = Math.max(0, Math.min(1, sp.alpha * expAlpha * 0.55));
          const spRgb = hexToRgb(sp.color || col);

          ctx.fillStyle = `rgba(${spRgb.r}, ${spRgb.g}, ${spRgb.b}, ${pAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, pRad, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. TIPOGRAFÍA ELEGANTE CON RESPLANDOR ETÉREO DIFUMINADO
      ctx.save();
      ctx.globalAlpha = expAlpha;
      ctx.translate(midX, topY);
      ctx.scale(exp.scale, exp.scale);

      const hasSub = Boolean(exp.subtext);
      const titleText = String(exp.title || '').toUpperCase();
      const subText = String(exp.subtext || '').toUpperCase();

      // Título nítido de alta fidelidad sin shadowBlur
      ctx.font = '900 22px "Plus Jakarta Sans", "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.save();
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.90)`;
      ctx.lineWidth = 4.5;
      ctx.strokeText(titleText, 0, 0);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleText, 0, 0);
      ctx.restore();

      // Subtítulo con cápsula luminosa etérea (sin oscurecer jamás la pista)
      if (hasSub) {
        const subY = 22;
        ctx.font = '800 10.5px "Plus Jakarta Sans", "Outfit", system-ui, sans-serif';
        const subMetrics = ctx.measureText(subText);
        const pillW = Math.max(90, subMetrics.width + 20);
        const pillH = 19;

        // Base difuminada luminosa translúcida
        ctx.save();
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-pillW / 2, subY - pillH / 2, pillW, pillH, 9.5);
        else ctx.rect(-pillW / 2, subY - pillH / 2, pillW, pillH);
        ctx.fill();

        // Borde fino brillante
        ctx.strokeStyle = `rgba(255, 255, 255, 0.70)`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();

        // Texto suave
        ctx.fillStyle = '#ffffff';
        ctx.fillText(subText, 0, subY);
      }

      ctx.restore();
      ctx.restore();
    }
  }

  renderMissFailureFeedback(ctx, currentTime) {
    if (!this.missHighlight) return;
    const now = performance.now();
    const elapsed = now - (this.missHighlight.time || now);
    if (elapsed > 1100) return;
    const alpha = Math.max(0, 1.0 - (elapsed / 1100));

    ctx.save();
    if (this.missHighlight.type === 'empty_tap') {
      const x = this.missHighlight.x || (this.width / 2);
      const y = this.missHighlight.y || (this.hitLineY || this.height * 0.84);

      // Neon red shockwaves
      const radius = 22 + (elapsed * 0.12);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 23, 68, ${(alpha * 0.9).toFixed(3)})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, radius * 1.45, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 0, 51, ${(alpha * 0.5).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing red warning cross
      const crossSize = 16;
      ctx.beginPath();
      ctx.moveTo(x - crossSize, y - crossSize);
      ctx.lineTo(x + crossSize, y + crossSize);
      ctx.moveTo(x + crossSize, y - crossSize);
      ctx.lineTo(x - crossSize, y + crossSize);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 4.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - crossSize, y - crossSize);
      ctx.lineTo(x + crossSize, y + crossSize);
      ctx.moveTo(x + crossSize, y - crossSize);
      ctx.lineTo(x - crossSize, y + crossSize);
      ctx.strokeStyle = `rgba(255, 0, 51, ${(alpha * 0.95).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

    } else if (this.missHighlight.type === 'note_dropped') {
      const note = this.missHighlight.note;
      const lane = (note && typeof note.lane === 'number') ? note.lane : (this.missHighlight.lane || 1);
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      let noteX = this.width / 2;
      if (this.visualDimension !== '2d') {
        const xL = this.getLaneBoundaryX(lane, hitY);
        const xR = this.getLaneBoundaryX(lane + 1, hitY);
        noteX = (xL + xR) / 2;
      } else {
        noteX = (lane + 0.5) * (this.width / 3);
      }

      // Glowing red warning aura around dropped note at hitline
      ctx.beginPath();
      ctx.arc(noteX, hitY, 48 + Math.sin(now * 0.015) * 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 0, 51, ${(alpha * 0.45).toFixed(3)})`;
      ctx.fill();

      // Warning text
      ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▼ PERDIDA ▼', noteX, hitY - 32);
    }
    ctx.restore();
  }

  renderDiscoLighting(ctx, currentTime) {
    if (!this.discoBall || (!this.discoBall.active && this.discoBall.descendY <= -80)) return;
    const w = this.width, h = this.height;
    const midX = w / 2;
    const nowSec = performance.now() / 1000;
    const swayX = Math.sin(nowSec * 1.3) * 3.0;
    const bobY = Math.sin(nowSec * 2.4) * 1.5;
    const ballX = midX + swayX;
    const ballY = this.discoBall.descendY + bobY;
    if (ballY < -40) return;

    const beatPulse = (typeof this.getBeatPulse === 'function') ? this.getBeatPulse() : 0;
    const rot = this.discoBall.rotation;
    const visAlpha = Math.max(0, Math.min(1, (ballY + 40) / 100));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = visAlpha;

    const numBeams = 8;
    const beamLength = Math.max(w, h) * 1.30;
    const beamPalette = GLOBAL_BEAM_PALETTE;

    // 1. HACES DE LUZ VOLUMÉTRICOS GIRATORIOS (Optimizado GPU: 0 Gradient Allocs por frame)
    for (let b = 0; b < numBeams; b++) {
      const angle = rot * 0.90 + (b * (Math.PI * 2 / numBeams));
      const rgb = beamPalette[b % beamPalette.length];
      const beamSpread = 0.075;
      const beamIntensity = (0.18 + 0.10 * beatPulse);

      ctx.save();
      ctx.translate(ballX, ballY);
      ctx.rotate(angle);

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamIntensity.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(beamLength * 0.72, -Math.tan(beamSpread) * beamLength * 0.72);
      ctx.lineTo(beamLength * 0.72, Math.tan(beamSpread) * beamLength * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. RESPLANDOR DIFUMINADO DE LUCES DE COLORES (Optimizado GPU: 0 Gradient Allocs por frame)
    const numGlowSpots = 6;
    for (let s = 0; s < numGlowSpots; s++) {
      const spotAngle = rot * 1.1 + (s * (Math.PI * 2 / numGlowSpots));
      const sinA = Math.sin(spotAngle);
      const cosA = Math.cos(spotAngle);
      if (cosA <= -0.2) continue;

      const progress = 0.25 + 0.65 * ((sinA + 1) * 0.5);
      const spotY = (h * 0.20) + (h * 0.65) * progress;
      const spotX = (w * 0.5) + (w * 0.44) * sinA;
      const spotRad = (20 + 28 * progress) * (1.0 + beatPulse * 0.20);
      const rgb = beamPalette[(s + 1) % beamPalette.length];
      const spotAlpha = (0.18 + 0.08 * Math.sin(nowSec * 3.5 + s * 1.7)) * (1.0 + beatPulse * 0.25);

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(spotAlpha * 0.45).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRad, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(spotAlpha * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotRad * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. MOTAS BRILLANTES DE ESPEJO
    if (this.discoBall.specks && this.discoBall.specks.length > 0) {
      const speckCount = Math.min(12, this.discoBall.specks.length);
      for (let i = 0; i < speckCount; i++) {
        const sp = this.discoBall.specks[i];
        const curAngle = sp.theta + rot * sp.speed;
        const distRatio = sp.dist;
        const spreadX = (w * 0.95) * distRatio;
        const spreadY = (h * 0.75) * distRatio;
        const sx = ballX + Math.cos(curAngle) * spreadX;
        const sy = ballY + Math.sin(curAngle) * spreadY + (sp.phi * h * 0.35);

        if (sx < 0 || sx > w || sy < 0 || sy > h) continue;

        const rgb = beamPalette[sp.colorIdx % beamPalette.length];
        const shimmer = 0.6 + 0.4 * Math.sin(nowSec * sp.shimmerSpeed + sp.shimmerPhase);
        const rad = (sp.size * 0.65) * (1.0 + beatPulse * 0.2);
        const alpha = Math.min(0.40, sp.brightness * shimmer * (0.22 + beatPulse * 0.18));

        ctx.fillStyle = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderDiscoTrackLightBeams(ctx, currentTime) {
    // Función anulada: sin elipses ni sombras en la pista
  }

  renderDiscoBall(ctx, currentTime) {
    if (!this.discoBall || (!this.discoBall.active && this.discoBall.descendY <= -80)) return;
    const w = this.width;
    const midX = w / 2;
    const nowSec = (this._frameNow || performance.now()) / 1000;
    const swayX = Math.sin(nowSec * 1.3) * 3.0;
    const bobY = Math.sin(nowSec * 2.4) * 1.5;
    const ballX = midX + swayX;
    const ballY = this.discoBall.descendY + bobY;
    if (ballY < -50) return;

    const radius = this.discoBall.radius || 27;
    const rot = this.discoBall.rotation;
    const visAlpha = Math.max(0, Math.min(1, (ballY + 40) / 100));

    ctx.save();
    ctx.globalAlpha = visAlpha;

    // 1. Cuerda metálica plateada
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(ballX, ballY - radius - 3);
    ctx.stroke();

    // 2. Enganche superior cromado
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(ballX, ballY - radius - 3, 4.0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Base esférica cromada (Sin createRadialGradient ni ctx.clip por frame)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(ballX - radius * 0.14, ballY - radius * 0.14, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ballX - radius * 0.32, ballY - radius * 0.32, radius * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // 4. Malla 3D de facetas (Todos los vértices están matemáticamente dentro de radius: 0 ctx.clip stencil stall)
    const latBands = 6;
    const lonSegments = 10;

    ctx.beginPath();
    for (let i = 0; i < latBands; i++) {
      const lat0 = -Math.PI * 0.42 + (i / latBands) * (Math.PI * 0.84);
      const lat1 = -Math.PI * 0.42 + ((i + 1) / latBands) * (Math.PI * 0.84);
      const cosLat0 = Math.cos(lat0), sinLat0 = Math.sin(lat0);
      const cosLat1 = Math.cos(lat1), sinLat1 = Math.sin(lat1);

      for (let j = 0; j < lonSegments; j++) {
        const lon0 = rot + (j / lonSegments) * Math.PI * 2;
        const lon1 = rot + ((j + 1) / lonSegments) * Math.PI * 2;

        if (cosLat0 * Math.cos(lon0) <= -0.15) continue;

        const x00 = radius * cosLat0 * Math.sin(lon0);
        const y00 = -radius * sinLat0;
        const x10 = radius * cosLat0 * Math.sin(lon1);
        const y10 = -radius * sinLat0;
        const x11 = radius * cosLat1 * Math.sin(lon1);
        const y11 = -radius * sinLat1;
        const x01 = radius * cosLat1 * Math.sin(lon0);
        const y01 = -radius * sinLat1;

        ctx.moveTo(ballX + x00, ballY + y00);
        ctx.lineTo(ballX + x10, ballY + y10);
        ctx.lineTo(ballX + x11, ballY + y11);
        ctx.lineTo(ballX + x01, ballY + y01);
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 0.65;
    ctx.stroke();

    // 5. Halo perimetral ligero (0 Gradient Allocs)
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.28)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius + 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderTopMilestone(ctx) {
    this.render3DComboExplosion(ctx);
  }

  renderRipples(ctx) {
    if (!this.fxRipples || this.fxRipples.length === 0 || !ctx) return;
    ctx.save();
    const len = this.fxRipples.length;
    const isRiverRipples = Boolean(this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive));

    for (let i = 0; i < len; i++) {
      const r = this.fxRipples[i];
      if (!r || r.alpha <= 0.01) continue;
      const alpha = Math.max(0, Math.min(1, r.alpha));
      const col = isRiverRipples ? '#00f2fe' : (r.color || '#00f2fe');
      const rad = Math.max(1, r.radius);
      const maxR = Math.max(10, r.maxRadius || 90);
      const progress = Math.min(1, rad / maxR);
      const widthFactor = 1 - progress;

      if (isRiverRipples) {
        // Triple onda de agua concéntrica con cresta de espuma blanca y anillo turquesa
        ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.92).toFixed(3)})`;
        ctx.lineWidth = Math.max(1.6, 3.8 * widthFactor);
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rad, rad * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (rad > 10) {
          ctx.strokeStyle = `rgba(0, 242, 254, ${(alpha * 0.75).toFixed(3)})`;
          ctx.lineWidth = Math.max(1.2, 2.6 * widthFactor);
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, rad * 0.68, rad * 0.68 * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (rad > 20) {
          ctx.strokeStyle = `rgba(186, 230, 253, ${(alpha * 0.58).toFixed(3)})`;
          ctx.lineWidth = Math.max(1.0, 1.8 * widthFactor);
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, rad * 0.36, rad * 0.36 * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        // Halo elíptico en escorzo 3D contenido dentro del receptor
        ctx.strokeStyle = hexToRgba(col, alpha * 0.85);
        ctx.lineWidth = Math.max(1.5, 4.0 * widthFactor);
        ctx.beginPath();
        if (ctx.ellipse) {
          ctx.ellipse(r.x, r.y, rad, rad * 0.36, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(r.x, r.y, rad * 0.6, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  renderMusicalNotes() {
    if (!this.musicalNotes || this.musicalNotes.length === 0) return;
    const ctx = this.ctx;
    if (!this._musicalNoteSpriteCache) {
      this._musicalNoteSpriteCache = new Map();
    }
    ctx.save();
    for (let i = 0; i < this.musicalNotes.length; i++) {
      const mn = this.musicalNotes[i];
      if (!mn || mn.alpha <= 0.01) continue;
      const col = mn.color || '#ffd700';
      const sym = mn.symbol || '♪';
      const cacheKey = `${sym}_${col}`;
      let sprite = this._musicalNoteSpriteCache.get(cacheKey);
      if (!sprite) {
        const off = document.createElement('canvas');
        off.width = 40;
        off.height = 40;
        const octx = off.getContext('2d');
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.font = 'bold 22px "Cinzel", serif';
        octx.fillStyle = col;
        octx.fillText(sym, 20, 20);
        octx.fillStyle = '#ffffff';
        octx.font = 'bold 18px "Cinzel", serif';
        octx.fillText(sym, 20, 20);
        sprite = off;
        if (this._musicalNoteSpriteCache.size < 64) {
          this._musicalNoteSpriteCache.set(cacheKey, sprite);
        }
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, mn.alpha));
      ctx.translate(mn.x, mn.y);
      ctx.rotate(mn.rotation || 0);
      ctx.scale(mn.scale || 1, mn.scale || 1);
      ctx.drawImage(sprite, -20, -20);
      ctx.restore();
    }
    ctx.restore();
  }

  _getLyricKeySprite(cleanLyric, isPressed = false) {
    if (!this._lyricKeySpriteCache) {
      this._lyricKeySpriteCache = new Map();
    }
    const key = `${cleanLyric}_${isPressed ? 1 : 0}`;
    let sp = this._lyricKeySpriteCache.get(key);
    if (sp) return sp;

    const sprW = 132;
    const sprH = 42;
    const off = document.createElement('canvas');
    off.width = sprW;
    off.height = sprH;
    const octx = off.getContext('2d');
    const fontScale = cleanLyric.length > 6 ? (6 / cleanLyric.length) : 1.0;
    const fontSize = Math.round(Math.max(13, 25 * fontScale));
    octx.font = `900 ${fontSize}px Montserrat, -apple-system, sans-serif`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.lineJoin = 'round';
    octx.strokeStyle = 'rgba(255, 175, 0, 0.90)';
    octx.lineWidth = 3.2;
    octx.strokeText(cleanLyric, sprW * 0.5, sprH * 0.5);
    octx.fillStyle = isPressed ? '#ffe57f' : '#ffffff';
    octx.fillText(cleanLyric, sprW * 0.5, sprH * 0.5);

    if (this._lyricKeySpriteCache.size > 320) {
      this._lyricKeySpriteCache.clear();
    }
    this._lyricKeySpriteCache.set(key, off);
    return off;
  }

  initStormModeAssets() {
    if (this._stormAssetsReady && this._stormCloudLayers && this._stormCloudLayers.length === 3) {
      return;
    }
    this._stormAssetsReady = true;
    this._stormCloudLayers = [];

    // Pre-hornear 3 capas de nubes cumulonimbus volumétricas de alta definición (0 gradientes en tiempo real)
    const layerConfigs = [
      { w: 520, h: 210, puffs: 34, darkCol: [8, 13, 26], midCol: [24, 35, 58], rimCol: [94, 126, 168], seed: 11 },
      { w: 520, h: 220, puffs: 40, darkCol: [6, 10, 22], midCol: [18, 28, 48], rimCol: [120, 155, 200], seed: 29 },
      { w: 520, h: 200, puffs: 32, darkCol: [4, 8, 18],  midCol: [14, 22, 40], rimCol: [148, 184, 228], seed: 47 }
    ];

    for (let lIdx = 0; lIdx < layerConfigs.length; lIdx++) {
      const cfg = layerConfigs[lIdx];
      const cvs = document.createElement('canvas');
      cvs.width = cfg.w;
      cvs.height = cfg.h;
      const cctx = cvs.getContext('2d');

      // Función pseudo-aleatoria determinista para tiling horizontal perfecto (wrap-around en cfg.w)
      let s = cfg.seed;
      const rand = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };

      const drawPuffWrapped = (px, py, rx, ry, rCol, gCol, bCol, alphaPeak) => {
        for (let offset = -cfg.w; offset <= cfg.w; offset += cfg.w) {
          const cx = px + offset;
          if (cx + rx < 0 || cx - rx > cfg.w) continue;
          cctx.save();
          cctx.translate(cx, py);
          cctx.scale(1, ry / Math.max(1, rx));
          const grad = cctx.createRadialGradient(0, -rx * 0.18, rx * 0.08, 0, 0, rx);
          grad.addColorStop(0.0, `rgba(${rCol}, ${gCol}, ${bCol}, ${alphaPeak})`);
          grad.addColorStop(0.48, `rgba(${rCol}, ${gCol}, ${bCol}, ${(alphaPeak * 0.85).toFixed(3)})`);
          grad.addColorStop(0.78, `rgba(${rCol}, ${gCol}, ${bCol}, ${(alphaPeak * 0.38).toFixed(3)})`);
          grad.addColorStop(1.0, `rgba(${rCol}, ${gCol}, ${bCol}, 0)`);
          cctx.fillStyle = grad;
          cctx.beginPath();
          cctx.arc(0, 0, rx, 0, Math.PI * 2);
          cctx.fill();
          cctx.restore();
        }
      };

      // 1. Base densa del banco de tormenta en el centro de la franja para cubrir la pista con volumen realista
      const bodyGrad = cctx.createLinearGradient(0, cfg.h * 0.14, 0, cfg.h * 0.90);
      bodyGrad.addColorStop(0.00, `rgba(${cfg.midCol[0]}, ${cfg.midCol[1]}, ${cfg.midCol[2]}, 0)`);
      bodyGrad.addColorStop(0.24, `rgba(${cfg.midCol[0]}, ${cfg.midCol[1]}, ${cfg.midCol[2]}, 0.82)`);
      bodyGrad.addColorStop(0.55, `rgba(${cfg.darkCol[0]}, ${cfg.darkCol[1]}, ${cfg.darkCol[2]}, 0.96)`);
      bodyGrad.addColorStop(0.80, `rgba(${cfg.darkCol[0]}, ${cfg.darkCol[1]}, ${cfg.darkCol[2]}, 0.78)`);
      bodyGrad.addColorStop(1.00, `rgba(${cfg.darkCol[0]}, ${cfg.darkCol[1]}, ${cfg.darkCol[2]}, 0)`);
      cctx.fillStyle = bodyGrad;
      cctx.fillRect(0, 0, cfg.w, cfg.h);

      // 2. Cúmulos superiores con borde plateado/azulado iluminado por la luna y tormenta
      for (let i = 0; i < cfg.puffs; i++) {
        const px = (i / cfg.puffs) * cfg.w + (rand() - 0.5) * 28;
        const py = cfg.h * (0.26 + rand() * 0.34);
        const rx = 44 + rand() * 52;
        const ry = 32 + rand() * 36;
        drawPuffWrapped(px, py - ry * 0.22, rx * 0.95, ry * 0.88, cfg.rimCol[0], cfg.rimCol[1], cfg.rimCol[2], 0.52);
        drawPuffWrapped(px, py, rx, ry, cfg.midCol[0], cfg.midCol[1], cfg.midCol[2], 0.92);
        drawPuffWrapped(px, py + ry * 0.28, rx * 1.05, ry * 0.92, cfg.darkCol[0], cfg.darkCol[1], cfg.darkCol[2], 0.95);
      }

      this._stormCloudLayers.push(cvs);
    }

    // Sprite pre-horneado de resplandor interno de nube para relámpagos
    const flashCvs = document.createElement('canvas');
    flashCvs.width = 256;
    flashCvs.height = 160;
    const fctx = flashCvs.getContext('2d');
    const fGrad = fctx.createRadialGradient(128, 80, 8, 128, 80, 124);
    fGrad.addColorStop(0.0, 'rgba(235, 250, 255, 0.95)');
    fGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.65)');
    fGrad.addColorStop(0.72, 'rgba(30, 64, 175, 0.25)');
    fGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0)');
    fctx.fillStyle = fGrad;
    fctx.fillRect(0, 0, 256, 160);
    this._stormFlashSprite = flashCvs;

    // Pool fijo de gotas de lluvia (0 GC)
    const w = this.width || 360;
    const h = this.height || 640;
    this._stormRainPool = Array.from({ length: 72 }, (_, idx) => ({
      x: Math.random() * (w + 120) - 40,
      y: Math.random() * h,
      len: (idx % 3 === 0) ? (22 + Math.random() * 14) : (13 + Math.random() * 10),
      speed: (idx % 3 === 0) ? (820 + Math.random() * 260) : (580 + Math.random() * 200),
      fg: (idx % 3 === 0)
    }));

    this._stormSplashes = Array.from({ length: 14 }, () => ({
      x: Math.random() * w,
      y: (this.hitLineY || h * 0.84) + (Math.random() - 0.5) * 18,
      r: Math.random() * 10,
      maxR: 7 + Math.random() * 9
    }));

    this._stormLightningBolts = [];
    this._stormNextLightningTime = (performance.now() || 0) + 1200;
    this._stormLightningFlashAlpha = 0;
    this._stormLastRenderNow = performance.now() || 0;
  }

  _spawnStormLightningBolt(nowPerf) {
    const w = this.width || 360;
    const h = this.height || 640;
    const startX = w * (0.16 + Math.random() * 0.68);
    const startY = 0;
    const endY = h * (0.56 + Math.random() * 0.28);
    const segments = [];
    const branches = [];
    let curX = startX;
    let curY = startY;
    const steps = 11;
    const stepY = (endY - startY) / steps;

    for (let i = 0; i < steps; i++) {
      const nextX = curX + (Math.random() - 0.5) * 42;
      const nextY = curY + stepY;
      segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });

      if (i > 1 && i < steps - 2 && Math.random() < 0.48) {
        let bx = nextX;
        let by = nextY;
        const bDir = Math.random() < 0.5 ? -1 : 1;
        for (let b = 0; b < 3; b++) {
          const nbx = bx + bDir * (10 + Math.random() * 18);
          const nby = by + stepY * (0.7 + Math.random() * 0.4);
          branches.push({ x1: bx, y1: by, x2: nbx, y2: nby });
          bx = nbx;
          by = nby;
        }
      }
      curX = nextX;
      curY = nextY;
    }

    if (!this._stormLightningBolts) this._stormLightningBolts = [];
    if (this._stormLightningBolts.length >= 2) this._stormLightningBolts.shift();
    this._stormLightningBolts.push({
      segments,
      branches,
      flashX: curX,
      flashY: Math.min(h * 0.60, endY * 0.85),
      birth: nowPerf,
      duration: 340
    });
    this._stormLightningFlashAlpha = 0.92;
    this._playStormThunderSound();
  }

  _playStormThunderSound() {
    try {
      if (this.masterMuted) return;
      const ctx = (this.synth && this.synth.ctx) ? this.synth.ctx : null;
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(92, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.48);
      const vol = Math.min(0.16, (this.masterVolume ?? 1.0) * 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.52);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.54);
    } catch (_) {}
  }

  renderStormModeOverlay(ctx, currentTime) {
    if (!this._stormAssetsReady || !this._stormCloudLayers || this._stormCloudLayers.length === 0) {
      this.initStormModeAssets();
    }
    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._stormLastRenderNow || nowPerf)) / 1000));
    this._stormLastRenderNow = nowPerf;

    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);

    // Disparar rayos automáticos de la tormenta cada 1.8s - 3.6s
    if (nowPerf >= (this._stormNextLightningTime || 0)) {
      this._spawnStormLightningBolt(nowPerf);
      this._stormNextLightningTime = nowPerf + 1750 + Math.random() * 1850;
    }

    if (this._stormLightningFlashAlpha > 0) {
      this._stormLightningFlashAlpha = Math.max(0, this._stormLightningFlashAlpha - dt * 2.8);
    }

    // Ráfaga de viento dinámica que inclina la lluvia y mece las nubes
    const windAngleX = -0.18 + Math.sin(nowPerf * 0.0011) * 0.07;
    const rainPool = this._stormRainPool || [];

    ctx.save();

    // 1. Lluvia de fondo (un solo path por lote para 0 sobrecarga GPU)
    ctx.strokeStyle = 'rgba(148, 197, 255, 0.34)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    for (let i = 0; i < rainPool.length; i++) {
      const r = rainPool[i];
      r.y += r.speed * dt;
      r.x += r.speed * windAngleX * dt;
      if (r.y > hitY + 28) {
        r.y = -25 - (i % 40);
        r.x = ((i * 53 + Math.floor(nowPerf * 0.17)) % (w + 140)) - 30;
      }
      if (!r.fg) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.len * windAngleX, r.y + r.len);
      }
    }
    ctx.stroke();

    // 2. Rayos eléctricos bifurcados de alta tensión
    if (this._stormLightningBolts && this._stormLightningBolts.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let bIdx = this._stormLightningBolts.length - 1; bIdx >= 0; bIdx--) {
        const bolt = this._stormLightningBolts[bIdx];
        const age = nowPerf - bolt.birth;
        if (age >= bolt.duration) {
          this._stormLightningBolts.splice(bIdx, 1);
          continue;
        }
        // Parpadeo eléctrico realista del rayo (enciende-apaga-enciende)
        const norm = age / bolt.duration;
        const flicker = (norm > 0.22 && norm < 0.36) || (norm > 0.56 && norm < 0.66) ? 0.15 : (1.0 - norm * 0.65);
        if (flicker <= 0.05) continue;

        // Halo exterior azul-eléctrico (sin shadowBlur)
        ctx.strokeStyle = `rgba(56, 189, 248, ${(flicker * 0.48).toFixed(3)})`;
        ctx.lineWidth = 7.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let s = 0; s < bolt.segments.length; s++) {
          const seg = bolt.segments[s];
          if (s === 0) ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();

        // Ramas secundarias
        if (bolt.branches.length > 0) {
          ctx.strokeStyle = `rgba(125, 211, 252, ${(flicker * 0.72).toFixed(3)})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          for (let br = 0; br < bolt.branches.length; br++) {
            const bSeg = bolt.branches[br];
            ctx.moveTo(bSeg.x1, bSeg.y1);
            ctx.lineTo(bSeg.x2, bSeg.y2);
          }
          ctx.stroke();
        }

        // Núcleo incandescente blanco puro del rayo
        ctx.strokeStyle = `rgba(255, 255, 255, ${(flicker * 0.98).toFixed(3)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let s = 0; s < bolt.segments.length; s++) {
          const seg = bolt.segments[s];
          if (s === 0) ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. BANCO DE NUBES VOLUMÉTRICAS HD EN LA ZONA MEDIA-BAJA DE LA PANTALLA
    // Cubre la parte media-baja de la pista (~38% a ~78% de la altura), dejando ver el inicio arriba y la línea de impacto abajo
    const cloudBandTop = hitY * 0.42;
    const cloudBandH = hitY * 0.46;
    const speeds = [22, -34, 46];

    for (let lIdx = 0; lIdx < this._stormCloudLayers.length; lIdx++) {
      const layerCvs = this._stormCloudLayers[lIdx];
      const tileW = Math.max(w * 1.25, 440);
      const scrollX = ((nowPerf * 0.001 * speeds[lIdx]) % tileW + tileW) % tileW;
      const bobY = Math.sin(nowPerf * 0.0016 + lIdx * 1.9) * 8;
      const drawY = cloudBandTop + (lIdx - 1) * 16 + bobY;

      ctx.globalAlpha = lIdx === 1 ? 0.98 : 0.92;
      ctx.drawImage(layerCvs, -scrollX, drawY, tileW, cloudBandH);
      ctx.drawImage(layerCvs, tileW - scrollX, drawY, tileW, cloudBandH);
    }

    // 4. Iluminación interna de las nubes cuando cae un rayo
    if (this._stormLightningFlashAlpha > 0.02 && this._stormFlashSprite) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.85, this._stormLightningFlashAlpha);
      const fx = (this._stormLightningBolts && this._stormLightningBolts[0]) ? this._stormLightningBolts[0].flashX : (w * 0.5);
      const fy = cloudBandTop + cloudBandH * 0.48;
      ctx.drawImage(this._stormFlashSprite, fx - w * 0.55, fy - cloudBandH * 0.55, w * 1.1, cloudBandH * 1.1);
      ctx.restore();
    }

    // 5. Lluvia intensa de primer plano + salpicaduras en la línea de golpeo
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(210, 235, 255, 0.56)';
    ctx.lineWidth = 1.65;
    ctx.beginPath();
    for (let i = 0; i < rainPool.length; i++) {
      const r = rainPool[i];
      if (r.fg) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.len * windAngleX, r.y + r.len);
      }
    }
    ctx.stroke();

    if (this._stormSplashes) {
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.42)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 0; i < this._stormSplashes.length; i++) {
        const sp = this._stormSplashes[i];
        sp.r += dt * 26;
        if (sp.r > sp.maxR) {
          sp.r = 1;
          sp.x = ((i * 73 + Math.floor(nowPerf * 0.23)) % (w - 40)) + 20;
        }
        ctx.moveTo(sp.x + sp.r, sp.y);
        if (ctx.ellipse) {
          ctx.ellipse(sp.x, sp.y, sp.r, sp.r * 0.32, 0, 0, Math.PI * 2);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // MODO SETAS ALUCINÓGENAS (PSICODELIA 120 FPS, SETAS HD, CÁMARA EBRIA E INVERSIÓN DE GRAVEDAD)
  // =========================================================================
  initMushroomModeAssets() {
    if (this._mushAssetsReady && this._mushSprites && this._mushSprites.length === 4) {
      return;
    }
    this._mushAssetsReady = true;
    this._mushSprites = [];

    // Pre-hornear 4 sprites de setas mágicas bioluminiscentes en alta definición (0 gradientes en tiempo real)
    const palettes = [
      { capTop: '#ff00aa', capBot: '#7900ff', spots: '#00f2fe', stem: '#ffe6ff', glow: 'rgba(255, 0, 170, 0.42)' },
      { capTop: '#00ff88', capBot: '#0088ff', spots: '#ffee00', stem: '#e0fff4', glow: 'rgba(0, 255, 136, 0.42)' },
      { capTop: '#ff5500', capBot: '#ff0055', spots: '#ffffff', stem: '#fff3e0', glow: 'rgba(255, 85, 0, 0.42)' },
      { capTop: '#00e5ff', capBot: '#7b2cbf', spots: '#ff00ff', stem: '#e0f7fa', glow: 'rgba(0, 229, 255, 0.42)' }
    ];

    for (let i = 0; i < palettes.length; i++) {
      const pal = palettes[i];
      const cvs = document.createElement('canvas');
      cvs.width = 76;
      cvs.height = 76;
      const c = cvs.getContext('2d');
      const cx = 38;
      const cy = 38;

      // Halo psicodélico exterior
      const halo = c.createRadialGradient(cx, cy - 4, 4, cx, cy, 36);
      halo.addColorStop(0, pal.glow);
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = halo;
      c.fillRect(0, 0, 76, 76);

      // Tallo orgánico curvado de la seta
      c.fillStyle = pal.stem;
      c.strokeStyle = pal.capBot;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx - 7, cy + 2);
      c.quadraticCurveTo(cx - 9, cy + 16, cx - 10, cy + 26);
      c.quadraticCurveTo(cx, cy + 31, cx + 10, cy + 26);
      c.quadraticCurveTo(cx + 8, cy + 15, cx + 7, cy + 2);
      c.closePath();
      c.fill();
      c.stroke();

      // Sombrero de seta alucinógena
      const capGrad = c.createLinearGradient(cx, cy - 26, cx, cy + 6);
      capGrad.addColorStop(0, pal.capTop);
      capGrad.addColorStop(1, pal.capBot);
      c.fillStyle = capGrad;
      c.beginPath();
      c.moveTo(cx - 26, cy + 4);
      c.bezierCurveTo(cx - 28, cy - 26, cx + 28, cy - 26, cx + 26, cy + 4);
      c.quadraticCurveTo(cx, cy + 10, cx - 26, cy + 4);
      c.closePath();
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.6;
      c.stroke();

      // Motas luminosas del sombrero
      c.fillStyle = pal.spots;
      const spotCoords = [
        { x: cx, y: cy - 14, r: 4.5 },
        { x: cx - 13, y: cy - 8, r: 3.6 },
        { x: cx + 13, y: cy - 8, r: 3.6 },
        { x: cx - 7, y: cy - 1, r: 2.6 },
        { x: cx + 8, y: cy - 1, r: 2.8 }
      ];
      for (let s = 0; s < spotCoords.length; s++) {
        const sp = spotCoords[s];
        c.beginPath();
        c.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        c.fill();
      }

      this._mushSprites.push(cvs);
    }

    // Pool fijo de setas flotantes a ambos lados de la pista y esporas luminosas (0 allocs en el bucle)
    this._mushSideMushrooms = [];
    for (let i = 0; i < 8; i++) {
      this._mushSideMushrooms.push({
        side: i % 2 === 0 ? -1 : 1,
        progress: (i / 8),
        speed: 0.14 + (i % 3) * 0.04,
        spriteIdx: i % 4,
        phase: i * 0.9,
        baseSize: 34 + (i % 3) * 10
      });
    }

    this._mushSporesPool = [];
    for (let i = 0; i < 28; i++) {
      this._mushSporesPool.push({
        x: (i * 41) % 360,
        y: (i * 67) % 640,
        vx: (i % 2 === 0 ? 1 : -1) * (12 + (i % 5) * 5),
        vy: -18 - (i % 4) * 9,
        r: 2.0 + (i % 3) * 1.4,
        color: ['#ff00ff', '#00ff88', '#00f2fe', '#ffee00'][i % 4],
        phase: i * 0.7
      });
    }
  }

  _triggerMushroomCloudTransition(currentTime) {
    if (!this._mushTransitionClouds) this._mushTransitionClouds = [];
    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    const horizonY = 12;
    const scrollDur = (Number.isFinite(this.scrollDurationMs) && this.scrollDurationMs > 0) ? this.scrollDurationMs : 1400;
    const wasFlipped = (this._mushFlipProgress || 0) > 0.5;
    const cloudPalette = ['#ff00ff', '#00ff88', '#00f2fe', '#ffee00', '#b833ff'];

    // 1. Completar holds activos limpiamente sin fallo
    if (this.activeHolds && this.activeHolds.size > 0) {
      for (const [, active] of this.activeHolds.entries()) {
        if (active && active.note) {
          active.note.holdCompleted = true;
          active.note.hit = true;
          active.note.holding = false;
          active.note.processed = true;
        }
      }
      this.activeHolds.clear();
    }

    // 2. Hacer desaparecer TODAS las teclas en pantalla y las que caerían durante el giro,
    // convirtiendo cada tecla en una explosión de Nube de Setas Alucinógenas
    const notesLen = this.notes ? this.notes.length : 0;
    const startIdx = Math.max(0, (this.firstActiveNoteIndex || 0) - 2);
    let dissolvedCount = 0;

    for (let i = startIdx; i < notesLen; i++) {
      const n = this.notes[i];
      if (!n || n.hit || n.missed || n.processed || n.holdCompleted) continue;
      const nTime = n.timestamp_ms ?? n.timeMs ?? 0;
      const dtNote = nTime - currentTime;
      if (dtNote > 2550) break;

      if (dtNote >= -350 && dtNote <= 2550) {
        const pRaw = Math.max(0.08, Math.min(0.95, 1.0 - (dtNote / scrollDur)));
        const coord = this.getPerspectiveCoord(n.lane ?? 1, pRaw);
        const screenX = coord.x;
        const screenY = wasFlipped ? (horizonY + hitY - coord.y) : coord.y;

        // Nube de humo psicodélica + seta brotando en la posición exacta de la tecla desaparecida
        for (let k = 0; k < 3; k++) {
          const ang = (k / 3) * Math.PI * 2 + (i * 0.7);
          this._mushTransitionClouds.push({
            x: screenX + Math.cos(ang) * 10,
            y: screenY + Math.sin(ang) * 8,
            vx: Math.cos(ang) * (28 + (k * 16)),
            vy: Math.sin(ang) * (24 + (k * 12)) - 18,
            r: 22 + (k % 2) * 14,
            maxR: 54 + (k % 3) * 18,
            color: cloudPalette[(i + k) % cloudPalette.length],
            age: 0,
            duration: 1.35 + (k * 0.18),
            isMushroomSprite: (k === 0),
            spriteIdx: (i + k) % 4,
            rot: (k - 1) * 0.25,
            rotSpeed: (k % 2 === 0 ? 1 : -1) * 2.2
          });
        }

        n.hit = true;
        n.processed = true;
        n.holding = false;
        if (n.type === 'hold') n.holdCompleted = true;
        dissolvedCount++;
      }
    }

    if (dissolvedCount > 0) {
      this.combo += dissolvedCount;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.stats.perfectPlus = (this.stats.perfectPlus || 0) + dissolvedCount;
      this.addScore(dissolvedCount * 350 * (this.multiplier || 1));
    }

    // 3. Gran Nube Central de Setas que envuelve la pista durante el giro de cámara
    for (let c = 0; c < 18; c++) {
      const frac = c / 18;
      const angle = frac * Math.PI * 2;
      const dist = 18 + (c % 4) * 28;
      this._mushTransitionClouds.push({
        x: w * 0.5 + Math.cos(angle) * dist,
        y: h * (0.25 + (c % 5) * 0.12),
        vx: Math.cos(angle) * (42 + (c % 3) * 22),
        vy: Math.sin(angle) * 30 - 12,
        r: 28 + (c % 3) * 16,
        maxR: 68 + (c % 4) * 22,
        color: cloudPalette[c % cloudPalette.length],
        age: 0,
        duration: 1.55 + (c % 3) * 0.2,
        isMushroomSprite: (c % 2 === 0),
        spriteIdx: c % 4,
        rot: Math.sin(c) * 0.4,
        rotSpeed: (c % 2 === 0 ? 1 : -1) * 2.6
      });
    }
  }

  _beginMushroomWorldTransform(ctx, currentTime) {
    if (!this._mushAssetsReady) this.initMushroomModeAssets();
    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._mushLastTransformNow || nowPerf)) / 1000));
    this._mushLastTransformNow = nowPerf;

    // Programar inversiones elegantes de gravedad cada ~14 segundos
    if (currentTime > 3000 && currentTime >= (this._mushNextFlipTimeMs || 9500)) {
      this._mushTargetFlipped = !this._mushTargetFlipped;
      this._mushNextFlipTimeMs = currentTime + 14000;
      this._mushBannerText = this._mushTargetFlipped
        ? '🍄 ¡NUBE DE SETAS: PERFECT ARRIBA! 🍄'
        : '🍄 ¡NUBE DE SETAS: PERFECT ABAJO! 🍄';
      this._mushBannerTimer = 2.8;
      this._mushSafeGraceUntilMs = currentTime + 2900;
      this._mushInSafeTransition = true;
      this.invulnerableUntil = Math.max(this.invulnerableUntil || 0, currentTime + 2900);
      this._triggerMushroomCloudTransition(currentTime);
    }

    const targetP = this._mushTargetFlipped ? 1.0 : 0.0;
    const curP = this._mushFlipProgress || 0.0;
    if (Math.abs(targetP - curP) > 0.001) {
      const step = dt / 1.55; // Transición suave y elegante de 1.55s mientras la nube de setas limpia la pista
      if (curP < targetP) {
        this._mushFlipProgress = Math.min(1.0, curP + step);
      } else {
        this._mushFlipProgress = Math.max(0.0, curP - step);
      }
      this._mushSafeGraceUntilMs = Math.max(this._mushSafeGraceUntilMs || 0, currentTime + 1150);
      this._mushInSafeTransition = true;
      this.invulnerableUntil = Math.max(this.invulnerableUntil || 0, currentTime + 1150);
    } else {
      this._mushFlipProgress = targetP;
      this._mushInSafeTransition = currentTime < (this._mushSafeGraceUntilMs || 0);
    }

    if (this._mushBannerTimer > 0) {
      this._mushBannerTimer = Math.max(0, this._mushBannerTimer - dt);
    }

    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    const horizonY = 12;
    const midTrackY = (horizonY + hitY) * 0.52;

    const tSec = currentTime * 0.001;
    const flipEase = 0.5 - 0.5 * Math.cos(Math.PI * (this._mushFlipProgress || 0));
    const flipSin = Math.sin(Math.PI * flipEase);

    // Balanceo de cámara ebria + rotación suave durante la transición de gravedad
    const camRoll = Math.sin(tSec * 1.45) * 0.052 + Math.cos(tSec * 0.82) * 0.025 + flipSin * 0.18;
    const camScaleX = (1.0 + Math.sin(tSec * 2.15) * 0.036) * (1.0 - flipSin * 0.12);
    const rawScaleY = (1.0 - 2.0 * flipEase) * (1.0 + Math.cos(tSec * 1.85) * 0.03);
    const safeScaleY = Math.abs(rawScaleY) < 0.07 ? (rawScaleY < 0 ? -0.07 : 0.07) : rawScaleY;
    const swayX = Math.sin(tSec * 1.15) * 11;

    ctx.save();
    ctx.translate(w * 0.5 + swayX, midTrackY);
    ctx.rotate(camRoll);
    ctx.scale(camScaleX, safeScaleY);
    ctx.translate(-w * 0.5, -midTrackY);
  }

  _endMushroomWorldTransform(ctx) {
    ctx.restore();
  }

  renderMushroomModeOverlay(ctx, currentTime) {
    if (!this._mushAssetsReady || !this._mushSprites) {
      this.initMushroomModeAssets();
    }
    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._mushLastOverlayNow || nowPerf)) / 1000));
    this._mushLastOverlayNow = nowPerf;

    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    const tSec = currentTime * 0.001;
    const beatDur = 60000 / Math.max(60, this.bpm || 120);
    const beatPulse = Math.pow(1.0 - ((currentTime % beatDur) / beatDur), 2.0);

    ctx.save();

    // 1. Neblina caleidoscópica psicodélica en los bordes (sin costosos radialGradients por frame)
    ctx.globalCompositeOperation = 'lighter';
    const auraColors = ['rgba(255, 0, 170, 0.11)', 'rgba(0, 255, 136, 0.10)', 'rgba(0, 229, 255, 0.11)'];
    const activeAura = auraColors[Math.floor(tSec * 1.5) % auraColors.length];
    ctx.fillStyle = activeAura;
    ctx.fillRect(0, 0, 18 + Math.sin(tSec * 3) * 6, h);
    ctx.fillRect(w - (18 + Math.cos(tSec * 3) * 6), 0, 24, h);

    // 2. Esporas psicodélicas flotantes
    if (this._mushSporesPool) {
      for (let i = 0; i < this._mushSporesPool.length; i++) {
        const sp = this._mushSporesPool[i];
        sp.x += (sp.vx + Math.sin(tSec * 2.2 + sp.phase) * 18) * dt;
        sp.y += sp.vy * (this._mushTargetFlipped ? -1 : 1) * dt;
        if (sp.y < -10) sp.y = h + 10;
        if (sp.y > h + 10) sp.y = -10;
        if (sp.x < -10) sp.x = w + 10;
        if (sp.x > w + 10) sp.x = -10;

        ctx.fillStyle = sp.color;
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(tSec * 4 + sp.phase);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r * (1 + beatPulse * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Setas alucinógenas animadas brotando y bailando a los lados de la pista
    ctx.globalCompositeOperation = 'source-over';
    if (this._mushSideMushrooms && this._mushSprites.length > 0) {
      for (let i = 0; i < this._mushSideMushrooms.length; i++) {
        const m = this._mushSideMushrooms[i];
        m.progress = (m.progress + m.speed * dt) % 1.0;
        const p = m.progress;
        const yPos = this._mushTargetFlipped
          ? (hitY - p * (hitY - 30))
          : (30 + p * (hitY - 30));
        const bndX = this.getLaneBoundaryX(m.side < 0 ? 0 : 3, 30 + p * (hitY - 30));
        const xPos = bndX + m.side * (16 + p * 18) + Math.sin(tSec * 3.2 + m.phase) * 7;
        const scaleM = (0.55 + 0.65 * p) * (1.0 + beatPulse * 0.24);
        const sz = m.baseSize * scaleM;
        const tilt = Math.sin(tSec * 4.0 + m.phase) * 0.28;

        ctx.save();
        ctx.globalAlpha = Math.min(0.95, p * 2.5) * (1.0 - Math.max(0, (p - 0.85) / 0.15));
        ctx.translate(xPos, yPos);
        ctx.rotate(tilt);
        ctx.scale(1.0 + Math.sin(tSec * 5 + m.phase) * 0.16, 1.0 + Math.cos(tSec * 5 + m.phase) * 0.16);
        const spr = this._mushSprites[m.spriteIdx % this._mushSprites.length];
        ctx.drawImage(spr, -sz * 0.5, -sz * 0.5, sz, sz);
        ctx.restore();
      }
    }

    // 4. Animación de NUBE DE SETAS al desaparecer las teclas durante la transición de gravedad
    if (this._mushTransitionClouds && this._mushTransitionClouds.length > 0) {
      for (let i = this._mushTransitionClouds.length - 1; i >= 0; i--) {
        const cl = this._mushTransitionClouds[i];
        cl.age += dt;
        if (cl.age >= cl.duration) {
          this._mushTransitionClouds.splice(i, 1);
          continue;
        }
        const prog = cl.age / cl.duration;
        const easeOut = 1.0 - Math.pow(1.0 - prog, 2.2);
        cl.x += cl.vx * dt;
        cl.y += cl.vy * dt;
        cl.rot += cl.rotSpeed * dt;
        const curR = cl.r + (cl.maxR - cl.r) * easeOut;
        const alpha = prog < 0.2 ? (prog / 0.2) : (1.0 - ((prog - 0.2) / 0.8));

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.max(0, Math.min(0.85, alpha * 0.65));
        ctx.fillStyle = cl.color;
        ctx.beginPath();
        ctx.arc(cl.x, cl.y, curR, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = Math.max(0, Math.min(0.95, alpha * 0.85));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cl.x - curR * 0.22, cl.y - curR * 0.18, curR * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (cl.isMushroomSprite && this._mushSprites && this._mushSprites.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha * 1.1));
          ctx.translate(cl.x, cl.y);
          ctx.rotate(cl.rot);
          const mSize = curR * 1.15;
          const spr = this._mushSprites[cl.spriteIdx % this._mushSprites.length];
          ctx.drawImage(spr, -mSize * 0.5, -mSize * 0.5, mSize, mSize);
          ctx.restore();
        }
      }
    }

    // 5. Portal circular y cartel durante la transición elegante de gravedad (sin perder combo)
    const flipEase = 0.5 - 0.5 * Math.cos(Math.PI * (this._mushFlipProgress || 0));
    const flipSin = Math.sin(Math.PI * flipEase);
    if (flipSin > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const portalR = (w * 0.42) * flipSin;
      ctx.strokeStyle = `rgba(255, 0, 255, ${(flipSin * 0.75).toFixed(2)})`;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.46, portalR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 255, 136, ${(flipSin * 0.75).toFixed(2)})`;
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.46, portalR * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this._mushBannerTimer > 0 && this._mushBannerText) {
      ctx.save();
      const alpha = Math.min(1, this._mushBannerTimer * 1.5);
      ctx.globalAlpha = alpha;
      const bannerY = h * 0.24;
      ctx.fillStyle = 'rgba(10, 4, 20, 0.82)';
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2.2;
      const bw = Math.min(w - 24, 332);
      const bh = 34;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh, 12);
      else ctx.rect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 12px "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(this._mushBannerText, w * 0.5, bannerY);
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // MODO CARRETERA (HIGHWAY MODE): F1, TESLA ROADSTER (VUELO + PIRUETA),
  // TRACTOR, FIAT 500 Y TRENECITOS DE VAPOR CON VAGONES (0 SOLAPAMIENTOS)
  // =========================================================================

  initHighwayModeAssets() {
    if (this._hwAssetsReady && this._hwSprites) {
      return;
    }
    this._hwAssetsReady = true;
    this._hwSprites = {
      tractor: this._buildHighwayTractorSprite(),
      fiat500: [
        this._buildHighwayFiat500Sprite('#6ee7b7', '#059669', '#ecfdf5'), // Verde Menta Dolcevita
        this._buildHighwayFiat500Sprite('#fde68a', '#d97706', '#fffbeb'), // Crema Amalfi
        this._buildHighwayFiat500Sprite('#fda4af', '#e11d48', '#fff1f2')  // Coral Italiano
      ],
      f1: [
        this._buildHighwayF1Sprite('#dc2626', '#991b1b', '#facc15', '16'), // Scuderia Rojo
        this._buildHighwayF1Sprite('#06b6d4', '#0e7490', '#ffffff', '44'), // Cian Mercedes/Petronas
        this._buildHighwayF1Sprite('#eab308', '#1e293b', '#ef4444', '1')   // Oro/Carbono RedBull
      ],
      tesla_roadster: this._buildHighwayTeslaRoadsterSprite(),
      steam_locomotive: this._buildHighwaySteamLocomotiveSprite(),
      steam_wagons: [
        this._buildHighwaySteamWagonSprite('tender', '#1e293b', '#f59e0b'),
        this._buildHighwaySteamWagonSprite('coach', '#b91c1c', '#fbbf24'),
        this._buildHighwaySteamWagonSprite('coach', '#047857', '#fde047'),
        this._buildHighwaySteamWagonSprite('caboose', '#dc2626', '#ffffff')
      ]
    };
    this._hwSmokeParticles = [];
  }

  _buildHighwayTractorSprite() {
    const cvs = document.createElement('canvas');
    cvs.width = 128;
    cvs.height = 176;
    const c = cvs.getContext('2d');
    const cx = 64;

    // 1. Sombra de contacto bajo el tractor
    c.fillStyle = 'rgba(0, 0, 0, 0.48)';
    c.beginPath();
    c.ellipse(cx, 92, 48, 72, 0, 0, Math.PI * 2);
    c.fill();

    // 2. Ruedas delanteras direccionables (arriba/trasera en perspectiva hacia abajo, el frente del vehículo apunta hacia ABAJO y=160)
    // Nota: Los vehículos caen de arriba (y=0) hacia abajo (hitLine), por tanto el MORRO apunta hacia ABAJO (y=156) y la TRASERA está arriba (y=20)
    const drawMudTire = (tx, ty, tw, th, isRear) => {
      c.save();
      c.fillStyle = '#111827';
      c.strokeStyle = '#030712';
      c.lineWidth = 2.5;
      c.beginPath();
      if (c.roundRect) c.roundRect(tx - tw * 0.5, ty - th * 0.5, tw, th, 6);
      else c.rect(tx - tw * 0.5, ty - th * 0.5, tw, th);
      c.fill();
      c.stroke();

      // Tacos profundos de goma agrícola en espiga
      c.strokeStyle = '#374151';
      c.lineWidth = isRear ? 3.2 : 2.2;
      const steps = isRear ? 7 : 5;
      for (let s = 0; s < steps; s++) {
        const yy = (ty - th * 0.40) + (s / (steps - 1)) * (th * 0.80);
        c.beginPath();
        c.moveTo(tx - tw * 0.44, yy - 2);
        c.lineTo(tx, yy + 2);
        c.lineTo(tx + tw * 0.44, yy - 2);
        c.stroke();
      }

      // Llanta amarilla John Deere lateral visible en escorzo
      c.fillStyle = '#facc15';
      c.fillRect(tx + (tx < cx ? -tw * 0.18 : -tw * 0.12), ty - th * 0.26, tw * 0.30, th * 0.52);
      c.restore();
    };

    // Enormes ruedas traseras (parte superior del sprite: y=54)
    drawMudTire(22, 56, 28, 64, true);
    drawMudTire(106, 56, 28, 64, true);
    // Ruedas delanteras más pequeñas junto al morro (parte inferior del sprite: y=132)
    drawMudTire(28, 130, 18, 42, false);
    drawMudTire(100, 130, 18, 42, false);

    // 3. Ejes metálicos pesados
    c.fillStyle = '#1f2937';
    c.fillRect(26, 50, 76, 12);
    c.fillRect(30, 125, 68, 9);

    // 4. Guardabarros traseros verdes con ribete amarillo
    c.fillStyle = '#15803d';
    c.strokeStyle = '#facc15';
    c.lineWidth = 2;
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(10, 22, 24, 68, 7);
      c.roundRect(94, 22, 24, 68, 7);
    } else {
      c.rect(10, 22, 24, 68);
      c.rect(94, 22, 24, 68);
    }
    c.fill();
    c.stroke();

    // 5. Capó largo del motor (apuntando hacia abajo y=82..154)
    const hoodGrad = c.createLinearGradient(cx - 22, 80, cx + 22, 80);
    hoodGrad.addColorStop(0.0, '#14532d');
    hoodGrad.addColorStop(0.5, '#22c55e');
    hoodGrad.addColorStop(1.0, '#14532d');
    c.fillStyle = hoodGrad;
    c.strokeStyle = '#052e16';
    c.lineWidth = 2.5;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 21, 78, 42, 74, [6, 6, 14, 14]);
    else c.rect(cx - 21, 78, 42, 74);
    c.fill();
    c.stroke();

    // Franja central amarilla y rejillas de ventilación del motor
    c.fillStyle = '#facc15';
    c.fillRect(cx - 4, 82, 8, 66);
    c.fillStyle = '#064e3b';
    for (let r = 0; r < 5; r++) {
      c.fillRect(cx - 16, 94 + r * 9, 9, 4);
      c.fillRect(cx + 7, 94 + r * 9, 9, 4);
    }

    // 6. Contrapeso delantero de hierro fundido y faros halógenos (en el morro inferior y=152)
    c.fillStyle = '#1e293b';
    c.strokeStyle = '#475569';
    c.lineWidth = 2;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 24, 147, 48, 12, 5);
    else c.rect(cx - 24, 147, 48, 12);
    c.fill();
    c.stroke();

    // Faros delanteros encendidos
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(cx - 14, 155, 5, 0, Math.PI * 2);
    c.arc(cx + 14, 155, 5, 0, Math.PI * 2);
    c.fill();

    // 7. Cabina acristalada panorámica con barras antivuelco (y=24..84)
    c.fillStyle = '#0f172a';
    c.strokeStyle = '#22c55e';
    c.lineWidth = 3.5;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 28, 22, 56, 62, 10);
    else c.rect(cx - 28, 22, 56, 62);
    c.fill();
    c.stroke();

    // Cristal azulado y techo verde con luz rotativa ámbar
    c.fillStyle = 'rgba(56, 189, 248, 0.35)';
    c.fillRect(cx - 23, 28, 46, 50);

    c.fillStyle = '#16a34a';
    c.strokeStyle = '#facc15';
    c.lineWidth = 2;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 22, 32, 44, 40, 8);
    else c.rect(cx - 22, 32, 44, 40);
    c.fill();
    c.stroke();

    // Sirena / Rotativo ámbar en el techo
    c.fillStyle = '#f59e0b';
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, 52, 8.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // 8. Tubo de escape vertical cromado en el capó (en x=46, y=108)
    c.fillStyle = '#94a3b8';
    c.strokeStyle = '#0f172a';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx - 13, 110, 6.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#020617';
    c.beginPath();
    c.arc(cx - 13, 110, 3.2, 0, Math.PI * 2);
    c.fill();

    return cvs;
  }

  _buildHighwayFiat500Sprite(bodyHex, shadeHex, highlightHex) {
    const cvs = document.createElement('canvas');
    cvs.width = 112;
    cvs.height = 156;
    const c = cvs.getContext('2d');
    const cx = 56;

    // 1. Sombra suave bajo el Fiat 500
    c.fillStyle = 'rgba(0, 0, 0, 0.45)';
    c.beginPath();
    c.ellipse(cx, 80, 40, 64, 0, 0, Math.PI * 2);
    c.fill();

    // 2. Cuatro neumáticos con tapacubos cromados clásicos
    c.fillStyle = '#0f172a';
    const wheels = [
      [17, 42], [95, 42],
      [17, 114], [95, 114]
    ];
    for (let i = 0; i < wheels.length; i++) {
      const [wx, wy] = wheels[i];
      c.beginPath();
      if (c.roundRect) c.roundRect(wx - 7, wy - 15, 14, 30, 4);
      else c.rect(wx - 7, wy - 15, 14, 30);
      c.fill();
    }

    // 3. Carrocería redondeada estilo "bambino" italiano (morro hacia abajo y=144, trasera arriba y=16)
    const bodyGrad = c.createLinearGradient(cx - 34, 20, cx + 34, 20);
    bodyGrad.addColorStop(0.0, shadeHex);
    bodyGrad.addColorStop(0.25, bodyHex);
    bodyGrad.addColorStop(0.5, highlightHex);
    bodyGrad.addColorStop(0.75, bodyHex);
    bodyGrad.addColorStop(1.0, shadeHex);

    c.fillStyle = bodyGrad;
    c.strokeStyle = '#0f172a';
    c.lineWidth = 2.8;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 34, 16, 68, 126, [24, 24, 30, 30]);
    else c.rect(cx - 34, 16, 68, 126);
    c.fill();
    c.stroke();

    // 4. Franja deportiva tricolor italiana (Verde - Blanco - Rojo) a lo largo del capó y techo
    c.fillStyle = '#16a34a';
    c.fillRect(cx - 6, 18, 4, 122);
    c.fillStyle = '#ffffff';
    c.fillRect(cx - 2, 18, 4, 122);
    c.fillStyle = '#dc2626';
    c.fillRect(cx + 2, 18, 4, 122);

    // 5. Habitáculo redondeado, parabrisas delantero (abajo y=96..112), luneta trasera (arriba y=28..42) y techo solar
    c.fillStyle = '#1e293b';
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 1.8;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 27, 30, 54, 80, 18);
    else c.rect(cx - 27, 30, 54, 80);
    c.fill();
    c.stroke();

    // Techo con ventana solar panorámica oscura
    c.fillStyle = bodyHex;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 23, 44, 46, 48, 12);
    else c.rect(cx - 23, 44, 46, 48);
    c.fill();

    c.fillStyle = '#090d16';
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1.4;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 17, 50, 34, 26, 7);
    else c.rect(cx - 17, 50, 34, 26);
    c.fill();
    c.stroke();

    // 6. Espejos retrovisores cromados
    c.fillStyle = '#f8fafc';
    c.strokeStyle = '#0f172a';
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(cx - 37, 94, 6, 4, -0.3, 0, Math.PI * 2);
    c.ellipse(cx + 37, 94, 6, 4, 0.3, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // 7. Parachoques cromados y "bigote" frontal clásico con insignia roja 500 + faros redondos dobles
    c.strokeStyle = '#f8fafc';
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(cx, 118, 28, 0.22 * Math.PI, 0.78 * Math.PI);
    c.stroke();

    // Insignia central roja Fiat
    c.fillStyle = '#ef4444';
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, 138, 4.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Faros redondos icónicos del Fiat 500
    c.fillStyle = '#fef9c3';
    c.strokeStyle = '#e2e8f0';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx - 20, 134, 6.2, 0, Math.PI * 2);
    c.arc(cx + 20, 134, 6.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Pilotos traseros rubí (arriba y=19)
    c.fillStyle = '#ef4444';
    c.fillRect(cx - 24, 17, 10, 5);
    c.fillRect(cx + 14, 17, 10, 5);

    return cvs;
  }

  _buildHighwayF1Sprite(primaryHex, darkHex, accentHex, raceNum) {
    const cvs = document.createElement('canvas');
    cvs.width = 124;
    cvs.height = 188;
    const c = cvs.getContext('2d');
    const cx = 62;

    // 1. Sombra aerodinámica bajo el monoplaza F1
    c.fillStyle = 'rgba(0, 0, 0, 0.50)';
    c.beginPath();
    c.ellipse(cx, 96, 46, 80, 0, 0, Math.PI * 2);
    c.fill();

    // 2. Brazos de suspensión de fibra de carbono (delanteros abajo y=134, traseros arriba y=42)
    c.strokeStyle = '#1e293b';
    c.lineWidth = 3.6;
    c.beginPath();
    // Suspensión trasera
    c.moveTo(22, 36); c.lineTo(cx, 48); c.lineTo(102, 36);
    c.moveTo(22, 48); c.lineTo(cx, 40); c.lineTo(102, 48);
    // Suspensión delantera (push-rod)
    c.moveTo(24, 130); c.lineTo(cx, 120); c.lineTo(100, 130);
    c.moveTo(24, 140); c.lineTo(cx, 136); c.lineTo(100, 140);
    c.stroke();

    // 3. Neumáticos Pirelli Slick expuestos con anillo de compuesto coloreado
    const drawPirelliSlick = (tx, ty, tw, th) => {
      c.save();
      c.fillStyle = '#090d16';
      c.strokeStyle = '#000000';
      c.lineWidth = 2;
      c.beginPath();
      if (c.roundRect) c.roundRect(tx - tw * 0.5, ty - th * 0.5, tw, th, 5);
      else c.rect(tx - tw * 0.5, ty - th * 0.5, tw, th);
      c.fill();
      c.stroke();

      // Brillo de goma slick caliente y banda Pirelli
      c.fillStyle = '#1e293b';
      c.fillRect(tx - tw * 0.32, ty - th * 0.44, tw * 0.64, th * 0.88);
      c.strokeStyle = accentHex;
      c.lineWidth = 2.2;
      c.strokeRect(tx - tw * 0.36, ty - th * 0.38, tw * 0.72, th * 0.76);
      c.restore();
    };
    // Ruedas traseras anchas (y=42) y delanteras (y=134)
    drawPirelliSlick(18, 42, 22, 42);
    drawPirelliSlick(106, 42, 22, 42);
    drawPirelliSlick(20, 134, 19, 38);
    drawPirelliSlick(104, 134, 19, 38);

    // 4. Fondo plano de fibra de carbono (Floor & Venturi tunnels)
    c.fillStyle = '#0f172a';
    c.strokeStyle = '#334155';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(cx - 16, 34);
    c.lineTo(cx + 16, 34);
    c.lineTo(cx + 34, 62);
    c.lineTo(cx + 32, 108);
    c.lineTo(cx + 10, 124);
    c.lineTo(cx - 10, 124);
    c.lineTo(cx - 32, 108);
    c.lineTo(cx - 34, 62);
    c.closePath();
    c.fill();
    c.stroke();

    // 5. Pontones aerodinámicos esculpidos (Sidepods) y cubierta motor con aleta de tiburón
    const bodyGrad = c.createLinearGradient(cx - 28, 40, cx + 28, 40);
    bodyGrad.addColorStop(0.0, darkHex);
    bodyGrad.addColorStop(0.5, primaryHex);
    bodyGrad.addColorStop(1.0, darkHex);
    c.fillStyle = bodyGrad;
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx - 8, 32);
    c.lineTo(cx + 8, 32);
    c.lineTo(cx + 28, 66);
    c.lineTo(cx + 26, 104);
    c.lineTo(cx + 9, 122);
    c.lineTo(cx + 6, 166);
    c.lineTo(cx - 6, 166);
    c.lineTo(cx - 9, 122);
    c.lineTo(cx - 26, 104);
    c.lineTo(cx - 28, 66);
    c.closePath();
    c.fill();
    c.stroke();

    // Branquias de refrigeración en los pontones y aleta de tiburón trasera
    c.strokeStyle = '#090d16';
    c.lineWidth = 2;
    for (let g = 0; g < 4; g++) {
      const gy = 68 + g * 7;
      c.beginPath();
      c.moveTo(cx - 22, gy); c.lineTo(cx - 13, gy + 3);
      c.moveTo(cx + 22, gy); c.lineTo(cx + 13, gy + 3);
      c.stroke();
    }
    // Aleta de tiburón (Shark fin)
    c.strokeStyle = accentHex;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(cx, 32);
    c.lineTo(cx, 66);
    c.stroke();

    // 6. Cockpit, Casco del Piloto y Sistema HALO de Titanio
    c.fillStyle = '#020617';
    c.beginPath();
    c.ellipse(cx, 88, 9.5, 16, 0, 0, Math.PI * 2);
    c.fill();

    // Casco del piloto con visera iridiscente
    c.fillStyle = accentHex;
    c.beginPath();
    c.arc(cx, 86, 6.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#0284c7';
    c.fillRect(cx - 5, 87, 10, 3.5);

    // Arco de seguridad HALO en V
    c.strokeStyle = '#e2e8f0';
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(cx - 8, 78);
    c.quadraticCurveTo(cx, 104, cx, 104);
    c.moveTo(cx + 8, 78);
    c.quadraticCurveTo(cx, 104, cx, 104);
    c.stroke();

    // 7. Alerón Trasero DRS (arriba y=14..28) + Luz FIA de lluvia roja
    c.fillStyle = '#0f172a';
    c.strokeStyle = accentHex;
    c.lineWidth = 2.2;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 34, 14, 68, 15, 3);
    else c.rect(cx - 34, 14, 68, 15);
    c.fill();
    c.stroke();
    c.fillStyle = primaryHex;
    c.fillRect(cx - 32, 20, 64, 4);
    // Luz FIA trasera roja brillante
    c.fillStyle = '#ff0033';
    c.beginPath();
    c.arc(cx, 31, 3.8, 0, Math.PI * 2);
    c.fill();

    // 8. Alerón Delantero Multi-plano (abajo en el morro y=158..174) con Endplates blancos
    c.fillStyle = '#0f172a';
    c.strokeStyle = '#f8fafc';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(cx - 44, 158);
    c.lineTo(cx, 165);
    c.lineTo(cx + 44, 158);
    c.lineTo(cx + 46, 171);
    c.lineTo(cx, 177);
    c.lineTo(cx - 46, 171);
    c.closePath();
    c.fill();
    c.stroke();

    c.strokeStyle = accentHex;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 42, 164);
    c.lineTo(cx, 170);
    c.lineTo(cx + 42, 164);
    c.stroke();

    // Dorsal numérico en el morro
    c.fillStyle = '#ffffff';
    c.font = '900 11px "Outfit", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(raceNum, cx, 138);

    return cvs;
  }

  _buildHighwayTeslaRoadsterSprite() {
    const cvs = document.createElement('canvas');
    cvs.width = 124;
    cvs.height = 176;
    const c = cvs.getContext('2d');
    const cx = 62;

    // 1. Sombra exterior
    c.fillStyle = 'rgba(0, 0, 0, 0.48)';
    c.beginPath();
    c.ellipse(cx, 92, 44, 72, 0, 0, Math.PI * 2);
    c.fill();

    // 2. Toberas de propulsores de gas frío SpaceX (Traseras en y=14 y laterales en y=58)
    c.fillStyle = '#334155';
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2;
    // Dos toberas traseras principales
    c.fillRect(cx - 18, 10, 12, 12);
    c.fillRect(cx + 6, 10, 12, 12);
    c.strokeRect(cx - 18, 10, 12, 12);
    c.strokeRect(cx + 6, 10, 12, 12);
    // Núcleo incandescente blanco/cian de propulsor
    c.fillStyle = '#e0f2fe';
    c.beginPath();
    c.arc(cx - 12, 12, 4.5, 0, Math.PI * 2);
    c.arc(cx + 12, 12, 4.5, 0, Math.PI * 2);
    c.fill();

    // 3. Ruedas deportivas aerodinámicas
    c.fillStyle = '#090d16';
    const wheels = [[18, 44], [106, 44], [19, 128], [105, 128]];
    for (let i = 0; i < wheels.length; i++) {
      const [wx, wy] = wheels[i];
      c.fillRect(wx - 6, wy - 16, 12, 32);
    }

    // 4. Carrocería superdeportiva Midnight Cherry Red con cintura de avispa
    const roadsterGrad = c.createLinearGradient(cx - 38, 20, cx + 38, 20);
    roadsterGrad.addColorStop(0.0, '#7f1d1d');
    roadsterGrad.addColorStop(0.22, '#dc2626');
    roadsterGrad.addColorStop(0.50, '#ff4d6d');
    roadsterGrad.addColorStop(0.78, '#dc2626');
    roadsterGrad.addColorStop(1.0, '#7f1d1d');

    c.fillStyle = roadsterGrad;
    c.strokeStyle = '#fecdd3';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(cx - 28, 18);
    c.lineTo(cx + 28, 18);
    c.quadraticCurveTo(cx + 40, 38, cx + 38, 56);
    c.lineTo(cx + 33, 88);
    c.quadraticCurveTo(cx + 40, 118, cx + 36, 144);
    c.quadraticCurveTo(cx, 166, cx - 36, 144);
    c.quadraticCurveTo(cx - 40, 118, cx - 33, 88);
    c.lineTo(cx - 38, 56);
    c.quadraticCurveTo(cx - 40, 38, cx - 28, 18);
    c.closePath();
    c.fill();
    c.stroke();

    // 5. Cúpula de cristal panorámica aerodinámica y asientos blancos SpaceX
    c.fillStyle = '#090d16';
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(cx - 21, 38);
    c.lineTo(cx + 21, 38);
    c.lineTo(cx + 25, 98);
    c.quadraticCurveTo(cx, 114, cx - 25, 98);
    c.closePath();
    c.fill();
    c.stroke();

    // Asientos deportivos blancos visibles a través del techo de cristal
    c.fillStyle = 'rgba(248, 250, 252, 0.78)';
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(cx - 15, 62, 11, 20, 4);
      c.roundRect(cx + 4, 62, 11, 20, 4);
    } else {
      c.rect(cx - 15, 62, 11, 20);
      c.rect(cx + 4, 62, 11, 20);
    }
    c.fill();

    // 6. Nervaduras del capó y barra de faros láser Cyber-LED en el morro (y=142..154)
    c.strokeStyle = '#7f1d1d';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 18, 106); c.lineTo(cx - 12, 148);
    c.moveTo(cx + 18, 106); c.lineTo(cx + 12, 148);
    c.stroke();

    // Faros láser LED afilados
    c.strokeStyle = '#ffffff';
    c.lineWidth = 3.6;
    c.beginPath();
    c.moveTo(cx - 32, 140); c.lineTo(cx - 14, 150);
    c.moveTo(cx + 32, 140); c.lineTo(cx + 14, 150);
    c.stroke();

    // Insignia "T" plateada en el morro
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 5, 146); c.lineTo(cx + 5, 146);
    c.moveTo(cx, 146); c.lineTo(cx, 153);
    c.stroke();

    return cvs;
  }

  _buildHighwaySteamLocomotiveSprite() {
    const cvs = document.createElement('canvas');
    cvs.width = 124;
    cvs.height = 176;
    const c = cvs.getContext('2d');
    const cx = 62;

    // 1. Sombra de la locomotora
    c.fillStyle = 'rgba(0, 0, 0, 0.52)';
    c.beginPath();
    c.ellipse(cx, 92, 44, 74, 0, 0, Math.PI * 2);
    c.fill();

    // 2. Bielas y ruedas motrices rojas con llanta de acero a ambos lados
    for (let r = 0; r < 3; r++) {
      const wy = 44 + r * 36;
      c.fillStyle = '#dc2626';
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 2.5;
      c.fillRect(14, wy - 12, 10, 24);
      c.strokeRect(14, wy - 12, 10, 24);
      c.fillRect(100, wy - 12, 10, 24);
      c.strokeRect(100, wy - 12, 10, 24);
    }
    // Biela lateral plateada conectando las ruedas
    c.fillStyle = '#cbd5e1';
    c.fillRect(16, 40, 4, 82);
    c.fillRect(104, 40, 4, 82);

    // 3. Apartavacas delantero en V (Cowcatcher rojo y dorado en el frente inferior y=144..170)
    c.fillStyle = '#b91c1c';
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(cx - 34, 140);
    c.lineTo(cx + 34, 140);
    c.lineTo(cx, 170);
    c.closePath();
    c.fill();
    c.stroke();

    // Rejilla metálica del apartavacas
    c.strokeStyle = '#fde68a';
    c.lineWidth = 1.8;
    for (let k = -24; k <= 24; k += 8) {
      c.beginPath();
      c.moveTo(cx + k, 141);
      c.lineTo(cx + k * 0.35, 165);
      c.stroke();
    }

    // 4. Bastidor lateral rojo imperial (Running boards)
    c.fillStyle = '#991b1b';
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 2;
    c.fillRect(cx - 34, 22, 68, 120);
    c.strokeRect(cx - 34, 22, 68, 120);

    // 5. Cabina del maquinista (arriba y=18..62) en rojo real con ribete de latón y resplandor de caldera
    c.fillStyle = '#7f1d1d';
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2.8;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 32, 18, 64, 46, 8);
    else c.rect(cx - 32, 18, 64, 46);
    c.fill();
    c.stroke();

    // Claraboya y resplandor naranja de carbón ardiente
    c.fillStyle = '#fb923c';
    c.fillRect(cx - 18, 22, 36, 8);

    // 6. Caldera cilíndrica negra mate (y=62..142) con bandas de latón dorado
    const boilerGrad = c.createLinearGradient(cx - 24, 62, cx + 24, 62);
    boilerGrad.addColorStop(0.0, '#020617');
    boilerGrad.addColorStop(0.35, '#1e293b');
    boilerGrad.addColorStop(0.50, '#475569');
    boilerGrad.addColorStop(0.65, '#1e293b');
    boilerGrad.addColorStop(1.0, '#020617');
    c.fillStyle = boilerGrad;
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 24, 60, 48, 82, 10);
    else c.rect(cx - 24, 60, 48, 82);
    c.fill();
    c.stroke();

    // 3 Bandas de latón dorado alrededor de la caldera
    c.fillStyle = '#fbbf24';
    c.fillRect(cx - 24, 76, 48, 4.5);
    c.fillRect(cx - 24, 98, 48, 4.5);
    c.fillRect(cx - 24, 120, 48, 4.5);

    // Domo de vapor de latón pulido (en y=88)
    c.fillStyle = '#f59e0b';
    c.strokeStyle = '#fef08a';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, 88, 10, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // 7. Gran Chimenea de Vapor (en y=126) + Gran Faro Dorado Central (en y=144)
    c.fillStyle = '#090d16';
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 3.2;
    c.beginPath();
    c.arc(cx, 126, 12, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.fillStyle = '#fef08a';
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(cx, 145, 7.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    return cvs;
  }

  _buildHighwaySteamWagonSprite(kind, bodyHex, trimHex) {
    const cvs = document.createElement('canvas');
    cvs.width = 108;
    cvs.height = 132;
    const c = cvs.getContext('2d');
    const cx = 54;

    // Sombra bajo el vagón
    c.fillStyle = 'rgba(0, 0, 0, 0.44)';
    c.beginPath();
    c.ellipse(cx, 66, 38, 56, 0, 0, Math.PI * 2);
    c.fill();

    // Enganches de acero delantero y trasero (Couplers)
    c.fillStyle = '#64748b';
    c.strokeStyle = '#0f172a';
    c.lineWidth = 2;
    c.fillRect(cx - 6, 4, 12, 16);
    c.strokeRect(cx - 6, 4, 12, 16);
    c.fillRect(cx - 6, 112, 12, 16);
    c.strokeRect(cx - 6, 112, 12, 16);

    // Ruedas de hierro de los bogies
    c.fillStyle = '#1e293b';
    c.fillRect(14, 26, 9, 24);
    c.fillRect(85, 26, 9, 24);
    c.fillRect(14, 82, 9, 24);
    c.fillRect(85, 82, 9, 24);

    // Cuerpo del vagón con borde dorado
    c.fillStyle = bodyHex;
    c.strokeStyle = trimHex;
    c.lineWidth = 3;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - 32, 16, 64, 100, 9);
    else c.rect(cx - 32, 16, 64, 100);
    c.fill();
    c.stroke();

    if (kind === 'tender') {
      // Vagón carbonero lleno de carbón mineral brillante
      c.fillStyle = '#090d16';
      c.fillRect(cx - 24, 26, 48, 80);
      c.fillStyle = '#334155';
      for (let k = 0; k < 12; k++) {
        const kx = cx - 18 + (k % 3) * 16 + ((k % 2) * 3);
        const ky = 34 + Math.floor(k / 3) * 18;
        c.beginPath();
        c.arc(kx, ky, 7, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      // Vagón expreso de pasajeros con ventanillas iluminadas cálidas y nervaduras de techo
      c.fillStyle = '#fef08a';
      for (let w = 0; w < 4; w++) {
        const wy = 26 + w * 21;
        c.fillRect(cx - 30, wy, 5, 13);
        c.fillRect(cx + 25, wy, 5, 13);
      }
      // Lomo central del techo del vagón
      c.fillStyle = 'rgba(255, 255, 255, 0.16)';
      c.fillRect(cx - 14, 20, 28, 92);
      c.strokeStyle = trimHex;
      c.lineWidth = 1.6;
      for (let r = 0; r < 5; r++) {
        const ry = 28 + r * 19;
        c.beginPath();
        c.moveTo(cx - 24, ry);
        c.lineTo(cx + 24, ry);
        c.stroke();
      }
      if (kind === 'caboose') {
        // Farolillos rojos de cola en el último vagón
        c.fillStyle = '#ff0033';
        c.beginPath();
        c.arc(cx - 18, 18, 4.5, 0, Math.PI * 2);
        c.arc(cx + 18, 18, 4.5, 0, Math.PI * 2);
        c.fill();
      }
    }

    return cvs;
  }

  _prepareHighwayTrafficChoreography() {
    if (!this.notes || this.notes.length === 0) return;
    // 🏎️ Reducimos la velocidad de todos los vehículos en general (duraciones más amplias en pantalla)
    // para que la lectura rítmica sea cómoda, fluida y accesible
    const baseDur = Math.max(2400, (this.scrollDurationMs || 1700) * 1.65);
    const nLen = this.notes.length;

    // 1. Asignación inicial de tipos de vehículo y velocidades base:
    // - Holds -> 'steam_train' (locomotora de vapor con vagones)
    // - Tap/Swipe -> mezcla variada de 'tractor' (lento), 'fiat500' (medio), 'f1' (ágil) y 'tesla_roadster' (adelanta volando con pirueta)
    const speedCatalog = {
      tractor: baseDur * 1.35,       // ~3500ms
      fiat500: baseDur * 1.18,       // ~3050ms
      steam_train: baseDur * 1.12,   // ~2900ms
      f1: baseDur * 0.94,            // ~2450ms
      tesla_roadster: baseDur * 0.86 // ~2250ms
    };

    const cycleTypes = ['f1', 'tractor', 'fiat500', 'tesla_roadster', 'fiat500', 'f1', 'tractor', 'tesla_roadster'];
    for (let i = 0; i < nLen; i++) {
      const n = this.notes[i];
      // En Modo Carretera no hay swipes: cualquier swipe se convierte en tap limpio
      if (n.type === 'swipe') {
        n.type = 'tap';
      }
      n._hwStartLane = n.lane ?? 1;
      n._hwPassLane = n.lane ?? 1;
      n._hwOvertakeP = -1;
      n._hwIsFlyingOvertake = false;
      n._hwVariantIdx = i % 3;

      if (n.type === 'hold') {
        n._hwVehicleType = 'steam_train';
        n._hwDurationMs = speedCatalog.steam_train;
      } else {
        const vType = cycleTypes[i % cycleTypes.length];
        n._hwVehicleType = vType;
        n._hwDurationMs = speedCatalog[vType];
      }
    }

    // 2. Planificador de adelantamientos espectaculares:
    for (let i = 0; i < nLen - 1; i++) {
      const fastN = this.notes[i];
      const slowN = this.notes[i + 1];
      if (!fastN || !slowN || fastN.type === 'hold' || slowN.type === 'hold') continue;

      const dtBeat = (slowN.timestamp_ms || 0) - (fastN.timestamp_ms || 0);
      if (dtBeat >= 230 && dtBeat <= 860 && (i % 2 === 0)) {
        const useTesla = (i % 4 === 0);
        fastN._hwVehicleType = useTesla ? 'tesla_roadster' : 'f1';
        fastN._hwDurationMs = useTesla ? speedCatalog.tesla_roadster : speedCatalog.f1;

        slowN._hwVehicleType = (i % 4 === 0) ? 'tractor' : 'fiat500';
        slowN._hwDurationMs = (slowN._hwVehicleType === 'tractor') ? speedCatalog.tractor : speedCatalog.fiat500;

        const dSlow = slowN._hwDurationMs;
        const dFast = fastN._hwDurationMs;
        const pOvertake = 1.0 - (dtBeat / Math.max(100, dSlow - dFast));

        if (pOvertake >= 0.20 && pOvertake <= 0.72) {
          fastN._hwOvertakeP = pOvertake;
          if (useTesla) {
            fastN._hwStartLane = slowN.lane;
            fastN._hwIsFlyingOvertake = true;
          } else {
            if (fastN.lane !== slowN.lane) {
              fastN._hwStartLane = slowN.lane;
            } else {
              const altLane = (fastN.lane === 1) ? ((i % 2 === 0) ? 0 : 2) : 1;
              fastN._hwPassLane = altLane;
            }
          }
          i++;
        }
      }
    }

    // 3. Pasada matemática estricta Anti-Solapamiento por carril (Garantía de 0% colisiones en carretera):
    const lastNoteByLane = [null, null, null];
    const minGapP = 0.22;
    for (let i = 0; i < nLen; i++) {
      const cur = this.notes[i];
      const lane = Math.max(0, Math.min(2, Math.round(cur.lane ?? 1)));
      const prev = lastNoteByLane[lane];

      if (prev) {
        const prevEndT = (prev.type === 'hold')
          ? (prev.end_timestamp_ms || (prev.timestamp_ms + (prev.duration_ms || 700)))
          : prev.timestamp_ms;
        const dt = (cur.timestamp_ms || 0) - (prevEndT || 0);
        const prevDur = prev._hwDurationMs || baseDur;

        const isBypassingPrev = (cur._hwIsFlyingOvertake || cur._hwPassLane !== lane || cur._hwStartLane !== lane);
        if (!isBypassingPrev) {
          const maxAllowedDur = Math.max(baseDur * 0.68, dt + prevDur * (1.0 - minGapP));
          if (cur._hwDurationMs > maxAllowedDur) {
            cur._hwDurationMs = maxAllowedDur;
          }
          const minAllowedDur = Math.max(baseDur * 0.68, prevDur - Math.max(0, dt - prevDur * minGapP));
          if (cur._hwDurationMs < minAllowedDur && dt < prevDur * 0.9) {
            cur._hwDurationMs = minAllowedDur;
          }
        }
      }
      lastNoteByLane[lane] = cur;
    }
  }

  _emitHighwaySmoke(x, y, vx, vy, rStart, rEnd, color, alpha, duration) {
    if (!this._hwSmokeParticles) this._hwSmokeParticles = [];
    if (!this._hwSmokeFreePool) this._hwSmokeFreePool = [];
    if (this._hwSmokeParticles.length >= 100) return;
    const sp = this._hwSmokeFreePool.length > 0 ? this._hwSmokeFreePool.pop() : {};
    sp.x = x;
    sp.y = y;
    sp.vx = vx;
    sp.vy = vy;
    sp.r = rStart;
    sp.maxR = rEnd;
    sp.color = color || '#ffffff';
    sp.alpha = alpha || 0.75;
    sp.age = 0;
    sp.duration = duration || 0.55;
    this._hwSmokeParticles.push(sp);
  }

  // Guía láser horizontal de sincronización Perfect+ (elegante, sin texto, alineada al punto exacto p=1.0)
  _drawHighwayTimingLaserBar(ctx, cx, cy, laneW, scale, pHead, isActiveHold = false, accentHex = '#38bdf8') {
    const barHalfW = laneW * 0.41;
    const proximityBoost = Math.max(0, Math.min(1, (pHead - 0.55) / 0.45));
    const coreH = Math.max(2.2, (2.8 + proximityBoost * 1.4) * scale);
    const glowH = Math.max(6.0, (9.5 + proximityBoost * 4.5) * scale);

    // 1. Halo suave translúcido (0 shadowBlur para máximo rendimiento GPU)
    ctx.fillStyle = isActiveHold
      ? 'rgba(250, 204, 21, 0.34)'
      : (proximityBoost > 0.5 ? 'rgba(56, 189, 248, 0.32)' : 'rgba(56, 189, 248, 0.18)');
    ctx.fillRect(cx - barHalfW, cy - glowH * 0.5, barHalfW * 2, glowH);

    // 2. Línea núcleo blanco-diamante en la coordenada exacta de impacto (cy)
    ctx.fillStyle = isActiveHold ? '#fef08a' : '#ffffff';
    ctx.fillRect(cx - barHalfW * 0.88, cy - coreH * 0.5, barHalfW * 1.76, coreH);

    // 3. Corchetes de precisión laterales [   ]
    const tickW = Math.max(3.5, 6.0 * scale);
    const tickH = Math.max(5.0, 8.5 * scale);
    ctx.strokeStyle = isActiveHold ? '#facc15' : accentHex;
    ctx.lineWidth = Math.max(1.5, 2.2 * scale);
    ctx.beginPath();
    // Izquierdo
    ctx.moveTo(cx - barHalfW + tickW, cy - tickH * 0.5);
    ctx.lineTo(cx - barHalfW, cy - tickH * 0.5);
    ctx.lineTo(cx - barHalfW, cy + tickH * 0.5);
    ctx.lineTo(cx - barHalfW + tickW, cy + tickH * 0.5);
    // Derecho
    ctx.moveTo(cx + barHalfW - tickW, cy - tickH * 0.5);
    ctx.lineTo(cx + barHalfW, cy - tickH * 0.5);
    ctx.lineTo(cx + barHalfW, cy + tickH * 0.5);
    ctx.lineTo(cx + barHalfW - tickW, cy + tickH * 0.5);
    ctx.stroke();
  }

  _renderHighwaySteamTrainHold(ctx, note, lane, currentTime, pHead, endT, isBeingHeld, maxH3D) {
    if (!this._hwAssetsReady || !this._hwSprites) this.initHighwayModeAssets();
    const noteDur = note._hwDurationMs || this.scrollDurationMs || 2900;
    const invNoteDur = 1.0 / noteDur;

    const currentHeadP = isBeingHeld ? 1.0 : pHead;
    const currentTailP = 1.0 - (endT - currentTime) * invNoteDur;
    if (currentTailP > 1.25 || currentHeadP < -0.20) return;

    const visibleTailP = Math.max(-0.08, currentTailP);
    const visibleHeadP = Math.min(1.18, currentHeadP);
    if (visibleHeadP <= visibleTailP) return;

    ctx.save();

    // 1. Puntos de perspectiva reutilizados en pool (0 allocs por frame)
    const railSteps = 16;
    if (!this._hwRailPtsPool) {
      this._hwRailPtsPool = [];
      for (let s = 0; s <= railSteps; s++) {
        this._hwRailPtsPool.push({ x: 0, y: 0, scale: 1, laneW: 100, p: 0 });
      }
    }
    const pts = this._hwRailPtsPool;
    for (let s = 0; s <= railSteps; s++) {
      const frac = s / railSteps;
      const pStep = visibleTailP + (visibleHeadP - visibleTailP) * frac;
      const c = this.getPerspectiveCoord(lane, pStep, this._coordScratch1);
      const pt = pts[s];
      pt.x = c.x;
      pt.y = c.y;
      pt.scale = c.scale;
      pt.laneW = c.laneW;
      pt.p = pStep;
    }

    // 2. CHASIS CONTINUO DE FERROCARRIL Y CINTA CONDUCTORA DE ENERGÍA HOLD (100% opaco en el núcleo para unir todo el tren)
    // A. Base oscura acorazada de balasto y acero
    ctx.beginPath();
    for (let s = 0; s <= railSteps; s++) {
      const pt = pts[s];
      const rOff = pt.laneW * 0.34;
      if (s === 0) ctx.moveTo(pt.x + rOff, pt.y);
      else ctx.lineTo(pt.x + rOff, pt.y);
    }
    for (let s = railSteps; s >= 0; s--) {
      const pt = pts[s];
      const rOff = pt.laneW * 0.34;
      ctx.lineTo(pt.x - rOff, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#090d16';
    ctx.fill();

    // B. Franja conductora central continua de alta visibilidad
    ctx.beginPath();
    for (let s = 0; s <= railSteps; s++) {
      const pt = pts[s];
      const rOff = pt.laneW * 0.25;
      if (s === 0) ctx.moveTo(pt.x + rOff, pt.y);
      else ctx.lineTo(pt.x + rOff, pt.y);
    }
    for (let s = railSteps; s >= 0; s--) {
      const pt = pts[s];
      const rOff = pt.laneW * 0.25;
      ctx.lineTo(pt.x - rOff, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = isBeingHeld ? 'rgba(234, 179, 8, 0.58)' : 'rgba(14, 165, 233, 0.42)';
    ctx.fill();

    // 3. Traviesas densas de madera de roble y acero
    const sleeperSpanP = visibleHeadP - visibleTailP;
    const numSleepers = Math.max(5, Math.min(32, Math.floor(sleeperSpanP * 28)));
    ctx.strokeStyle = isBeingHeld ? '#a16207' : '#78350f';
    for (let k = 0; k <= numSleepers; k++) {
      const pSl = visibleTailP + (k / numSleepers) * sleeperSpanP;
      const sc = this.getPerspectiveCoord(lane, pSl, this._coordScratch1);
      const slHalfW = sc.laneW * 0.35;
      ctx.lineWidth = Math.max(2.2, 4.8 * sc.scale);
      ctx.beginPath();
      ctx.moveTo(sc.x - slHalfW, sc.y);
      ctx.lineTo(sc.x + slHalfW, sc.y);
      ctx.stroke();
    }

    // 4. Raíles laterales continuos y tercer riel central de energía Hold
    ctx.strokeStyle = isBeingHeld ? '#fde047' : '#38bdf8';
    ctx.lineWidth = Math.max(3.0, 5.4 * pts[railSteps].scale);
    ctx.beginPath();
    for (let s = 0; s <= railSteps; s++) {
      const pt = pts[s];
      const rOff = pt.laneW * 0.24;
      if (s === 0) ctx.moveTo(pt.x - rOff, pt.y);
      else ctx.lineTo(pt.x - rOff, pt.y);
    }
    for (let s = 0; s <= railSteps; s++) {
      const pt = pts[s];
      const rOff = pt.laneW * 0.24;
      if (s === 0) ctx.moveTo(pt.x + rOff, pt.y);
      else ctx.lineTo(pt.x + rOff, pt.y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.4, 2.2 * pts[railSteps].scale);
    ctx.stroke();

    // 5. VAGONES MUY JUNTOS CON FUELLES ARTICULADOS MACIZOS (Sin huecos vacíos: forman un único tren continuo)
    const headCoord = this.getPerspectiveCoord(lane, Math.min(1.06, currentHeadP), this._coordScratch0);
    const locoW = Math.min(headCoord.laneW * 0.72, 76 * headCoord.scale);
    const locoH = locoW * 1.38;

    // Paso corto (0.068) para que cada vagón vaya pegado parachoques con parachoques al siguiente
    const wagonStepP = 0.068;
    const firstWagonHeadOffset = 0.068;
    const availableWagonSpan = Math.max(0, (currentHeadP - firstWagonHeadOffset) - currentTailP);
    const wagonCount = Math.min(36, Math.max(2, Math.ceil(availableWagonSpan / wagonStepP) + 1));
    const wagonsSprites = this._hwSprites.steam_wagons;

    let prevCenterX = null;
    let prevCenterY = null;
    let prevWWidth = 0;
    let tailBumperCoord = null;

    for (let wIdx = wagonCount - 1; wIdx >= 0; wIdx--) {
      const pWagon = currentHeadP - firstWagonHeadOffset - wIdx * wagonStepP;
      if (pWagon < -0.06 || pWagon > 1.12) continue;
      if (pWagon < currentTailP - 0.015) continue;

      const wCoord = this.getPerspectiveCoord(lane, pWagon, this._coordScratch1);
      const wWidth = Math.min(wCoord.laneW * 0.66, 68 * wCoord.scale);
      const wHeight = wWidth * 1.24;
      const swayX = Math.sin(currentTime * 0.014 + wIdx * 0.9) * (1.2 * wCoord.scale);
      const curCx = wCoord.x + swayX;
      const curCy = wCoord.y;

      if (!tailBumperCoord) {
        tailBumperCoord = { x: curCx, y: curCy - wHeight * 0.48, scale: wCoord.scale, w: wWidth };
      }

      // Fuelle articulado macizo (acordeón ferroviario) que une este vagón con el anterior sin dejar hueco de asfalto
      if (prevCenterX !== null) {
        const bellowW = Math.min(prevWWidth, wWidth) * 0.56;
        const topY = Math.min(prevCenterY, curCy);
        const botY = Math.max(prevCenterY, curCy);
        const midX = (prevCenterX + curCx) * 0.5;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(midX - bellowW * 0.5, topY, bellowW, Math.max(4, botY - topY));

        ctx.strokeStyle = isBeingHeld ? '#fde047' : '#38bdf8';
        ctx.lineWidth = Math.max(1.6, 2.6 * wCoord.scale);
        ctx.strokeRect(midX - bellowW * 0.5, topY, bellowW, Math.max(4, botY - topY));
      }

      let spr = wagonsSprites[1];
      if (wIdx === 0) spr = wagonsSprites[0];
      else if (wIdx === wagonCount - 1) spr = wagonsSprites[3];
      else spr = wagonsSprites[1 + (wIdx % 2)];

      ctx.drawImage(spr, curCx - wWidth * 0.5, curCy - wHeight * 0.50, wWidth, wHeight);

      prevCenterX = curCx;
      prevCenterY = curCy;
      prevWWidth = wWidth;
    }

    // Fuelle articulado entre el primer vagón (carbonero) y la locomotora
    if (prevCenterX !== null) {
      const bellowW = Math.min(prevWWidth, locoW) * 0.54;
      const topY = Math.min(prevCenterY, headCoord.y);
      const botY = Math.max(prevCenterY, headCoord.y);
      const midX = (prevCenterX + headCoord.x) * 0.5;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(midX - bellowW * 0.5, topY, bellowW, Math.max(4, botY - topY));
      ctx.strokeStyle = isBeingHeld ? '#fde047' : '#38bdf8';
      ctx.lineWidth = Math.max(1.6, 2.6 * headCoord.scale);
      ctx.strokeRect(midX - bellowW * 0.5, topY, bellowW, Math.max(4, botY - topY));
    }

    // 6. Barra de topes traseros con doble farol rojo luminoso en la cola del último vagón (sin texto)
    if (tailBumperCoord && currentTailP > -0.05 && currentTailP < 1.10) {
      const tb = tailBumperCoord;
      const barW = tb.w * 0.44;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = Math.max(3.5, 6.0 * tb.scale);
      ctx.beginPath();
      ctx.moveTo(tb.x - barW, tb.y);
      ctx.lineTo(tb.x + barW, tb.y);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = Math.max(2.0, 3.4 * tb.scale);
      ctx.stroke();

      const lampR = Math.max(2.5, 4.2 * tb.scale);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tb.x - barW * 0.65, tb.y, lampR, 0, Math.PI * 2);
      ctx.arc(tb.x + barW * 0.65, tb.y, lampR, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Locomotora de Vapor en la cabeza del Hold (centrada sobre headCoord.y para que coincida con la guía láser)
    const chugBounce = isBeingHeld
      ? Math.sin(currentTime * 0.035) * (2.0 * headCoord.scale)
      : Math.sin(currentTime * 0.018) * (1.0 * headCoord.scale);

    // Guía láser horizontal de sincronización Perfect+ exactamente en headCoord.y
    this._drawHighwayTimingLaserBar(ctx, headCoord.x, headCoord.y, headCoord.laneW, headCoord.scale, currentHeadP, isBeingHeld, '#facc15');

    // Cono de luz dorada del faro delantero sobre la vía
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const beamLen = (isBeingHeld ? 62 : 44) * headCoord.scale;
    const frontBumperY = headCoord.y + locoH * 0.36;
    const beamGrad = ctx.createLinearGradient(headCoord.x, frontBumperY, headCoord.x, frontBumperY + beamLen);
    beamGrad.addColorStop(0.0, isBeingHeld ? 'rgba(254, 240, 138, 0.78)' : 'rgba(254, 240, 138, 0.45)');
    beamGrad.addColorStop(1.0, 'rgba(254, 240, 138, 0.0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(headCoord.x - 9 * headCoord.scale, frontBumperY);
    ctx.lineTo(headCoord.x + 9 * headCoord.scale, frontBumperY);
    ctx.lineTo(headCoord.x + 28 * headCoord.scale, frontBumperY + beamLen);
    ctx.lineTo(headCoord.x - 28 * headCoord.scale, frontBumperY + beamLen);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.drawImage(
      this._hwSprites.steam_locomotive,
      headCoord.x + chugBounce * 0.4 - locoW * 0.5,
      headCoord.y - locoH * 0.50,
      locoW,
      locoH
    );

    // 8. Chispas de rieles si está siendo sostenido (hold activo)
    if (isBeingHeld) {
      const sparkY = headCoord.y;
      const slOff = locoW * 0.42;
      this._emitHighwaySmoke(headCoord.x - slOff, sparkY, -26 - Math.random() * 20, -14, 2 * headCoord.scale, 5 * headCoord.scale, '#fde047', 0.9, 0.22);
      this._emitHighwaySmoke(headCoord.x + slOff, sparkY, 26 + Math.random() * 20, -14, 2 * headCoord.scale, 5 * headCoord.scale, '#fde047', 0.9, 0.22);
    }

    // 9. Bocanadas de vapor blanco continuo desde la chimenea
    if (!note._lastSteamMs || (currentTime - note._lastSteamMs > (isBeingHeld ? 52 : 110))) {
      note._lastSteamMs = currentTime;
      const stackX = headCoord.x + (Math.random() - 0.5) * 6 * headCoord.scale;
      const stackY = headCoord.y + locoH * 0.08;
      this._emitHighwaySmoke(
        stackX,
        stackY,
        (Math.random() - 0.5) * 24,
        -38 - Math.random() * 24,
        7 * headCoord.scale,
        (isBeingHeld ? 28 : 20) * headCoord.scale,
        isBeingHeld ? '#fef9c3' : '#f8fafc',
        isBeingHeld ? 0.88 : 0.68,
        0.58
      );
    }

    ctx.restore();
  }

  _renderHighwayVehicleNote(ctx, note, noteIdx, lane, currentTime, pHead, maxH3D) {
    if (!this._hwAssetsReady || !this._hwSprites) this.initHighwayModeAssets();
    const vType = note._hwVehicleType || 'f1';

    // 1. Calcular carril dinámico (adelantamientos limpios sin solaparse) y vuelo/pirueta del Tesla Roadster
    let visualLane = lane;
    let steerAngle = 0;
    let flightLift = 0;      // 0 en asfalto, hasta 1.0 en pleno vuelo del Tesla Roadster
    let pirouetteAngle = 0;  // Rotación 360° (2*PI) durante la pirueta aérea del Tesla Roadster
    let blinkerSide = 0;     // -1 intermitente izquierdo, +1 intermitente derecho

    const overtakeP = note._hwOvertakeP ?? -1;
    if (overtakeP > 0) {
      if (note._hwIsFlyingOvertake && vType === 'tesla_roadster') {
        const fStart = Math.max(0.06, overtakeP - 0.24);
        const fEnd = Math.min(0.78, overtakeP + 0.22);
        if (pHead < fStart) {
          visualLane = note._hwStartLane ?? lane;
        } else if (pHead <= fEnd) {
          const u = (pHead - fStart) / Math.max(0.01, fEnd - fStart);
          const smoothU = 0.5 - 0.5 * Math.cos(Math.PI * u);
          visualLane = (note._hwStartLane ?? lane) + (lane - (note._hwStartLane ?? lane)) * smoothU;
          flightLift = Math.sin(Math.PI * u);
          pirouetteAngle = (0.5 - 0.5 * Math.cos(Math.PI * u)) * Math.PI * 2;
        } else {
          visualLane = lane;
        }
      } else if ((note._hwStartLane !== undefined) && note._hwStartLane !== lane) {
        const sStart = Math.max(0.08, overtakeP - 0.22);
        const sEnd = Math.min(0.74, overtakeP + 0.10);
        if (pHead < sStart) {
          visualLane = note._hwStartLane;
          if (pHead > sStart - 0.12) {
            blinkerSide = (lane > note._hwStartLane) ? 1 : -1;
          }
        } else if (pHead <= sEnd) {
          const u = (pHead - sStart) / Math.max(0.01, sEnd - sStart);
          const smoothU = 0.5 - 0.5 * Math.cos(Math.PI * u);
          visualLane = note._hwStartLane + (lane - note._hwStartLane) * smoothU;
          const dir = (lane > note._hwStartLane) ? 1 : -1;
          steerAngle = Math.sin(Math.PI * u) * 0.22 * dir;
          blinkerSide = dir;
        } else {
          visualLane = lane;
        }
      } else if ((note._hwPassLane !== undefined) && note._hwPassLane !== lane) {
        const pStart = Math.max(0.06, overtakeP - 0.24);
        const pEnd = Math.min(0.76, overtakeP + 0.20);
        if (pHead >= pStart && pHead <= pEnd) {
          const u = (pHead - pStart) / Math.max(0.01, pEnd - pStart);
          const offsetBell = Math.sin(Math.PI * u);
          visualLane = lane + (note._hwPassLane - lane) * offsetBell;
          steerAngle = Math.cos(Math.PI * u) * 0.20 * ((note._hwPassLane > lane) ? 1 : -1);
          blinkerSide = (u < 0.5) ? ((note._hwPassLane > lane) ? 1 : -1) : ((lane > note._hwPassLane) ? 1 : -1);
        }
      }
    }

    const coord = this.getPerspectiveCoord(visualLane, pHead, this._coordScratch0);
    const scale = coord.scale;
    const laneW = coord.laneW;

    // 2. Dimensiones contenidas dentro del carril
    let carW = Math.min(laneW * 0.66, 72 * scale);
    let carH = carW * 1.42;
    let sprite = this._hwSprites.f1[0];
    let laserAccent = '#38bdf8';

    if (vType === 'tractor') {
      carW = Math.min(laneW * 0.68, 74 * scale);
      carH = carW * 1.36;
      sprite = this._hwSprites.tractor;
      laserAccent = '#4ade80';
    } else if (vType === 'fiat500') {
      carW = Math.min(laneW * 0.60, 64 * scale);
      carH = carW * 1.38;
      const fList = this._hwSprites.fiat500;
      sprite = fList[(note._hwVariantIdx || 0) % fList.length];
      laserAccent = '#facc15';
    } else if (vType === 'f1') {
      carW = Math.min(laneW * 0.66, 72 * scale);
      carH = carW * 1.50;
      const f1List = this._hwSprites.f1;
      sprite = f1List[(note._hwVariantIdx || 0) % f1List.length];
      laserAccent = '#f87171';
    } else if (vType === 'tesla_roadster') {
      carW = Math.min(laneW * 0.66, 72 * scale);
      carH = carW * 1.42;
      sprite = this._hwSprites.tesla_roadster;
      laserAccent = '#38bdf8';
    }

    // 3. Centrar el vehículo sobre coord.y (igual que las teclas normales) para que el juicio de impacto sea 100% intuitivo
    const liftOffsetY = flightLift * (46 * scale);
    const drawX = coord.x;
    const drawCenterY = coord.y - carH * 0.06 - liftOffsetY;

    if (vType === 'tesla_roadster') {
      const smokeInterval = flightLift > 0.05 ? 24 : 52;
      if (!note._lastSmokeMs || (currentTime - note._lastSmokeMs >= smokeInterval)) {
        note._lastSmokeMs = currentTime;
        const rearY = drawCenterY - carH * 0.44;
        const spread = (flightLift > 0.05 ? 16 : 9) * scale;
        this._emitHighwaySmoke(
          drawX - spread + (Math.random() - 0.5) * 6,
          rearY,
          (Math.random() - 0.5) * (flightLift > 0.05 ? 65 : 22),
          -55 - Math.random() * 40,
          (flightLift > 0.05 ? 9 : 6) * scale,
          (flightLift > 0.05 ? 30 : 20) * scale,
          '#ffffff',
          flightLift > 0.05 ? 0.92 : 0.72,
          flightLift > 0.05 ? 0.62 : 0.45
        );
        this._emitHighwaySmoke(
          drawX + spread + (Math.random() - 0.5) * 6,
          rearY,
          (Math.random() - 0.5) * (flightLift > 0.05 ? 65 : 22),
          -55 - Math.random() * 40,
          (flightLift > 0.05 ? 9 : 6) * scale,
          (flightLift > 0.05 ? 30 : 20) * scale,
          '#f1f5f9',
          flightLift > 0.05 ? 0.88 : 0.68,
          flightLift > 0.05 ? 0.62 : 0.45
        );
      }
    } else if (vType === 'tractor') {
      if (!note._lastSmokeMs || (currentTime - note._lastSmokeMs >= 135)) {
        note._lastSmokeMs = currentTime;
        this._emitHighwaySmoke(
          drawX - carW * 0.18,
          drawCenterY + carH * 0.10,
          -12 + (Math.random() - 0.5) * 14,
          -34 - Math.random() * 18,
          4.5 * scale,
          15 * scale,
          '#cbd5e1',
          0.55,
          0.48
        );
      }
    }

    ctx.save();

    // 4. Guía Láser Horizontal de Sincronización Perfect+ en coord.y (permite clavar el timing con la misma precisión visual que una tecla normal)
    this._drawHighwayTimingLaserBar(ctx, coord.x, coord.y, laneW, scale, pHead, false, laserAccent);

    // 5. Si el Tesla Roadster está adelantando en pleno vuelo, dibujar su sombra proyectada sobre el asfalto debajo
    if (flightLift > 0.02) {
      ctx.fillStyle = `rgba(0, 0, 0, ${(0.45 * (1 - flightLift * 0.35)).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(coord.x, coord.y, carW * 0.42 * (1 - flightLift * 0.2), carH * 0.44 * (1 - flightLift * 0.2), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Haces de luz de los faros delanteros proyectados hacia delante en el asfalto
    if (flightLift < 0.35) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const beamLen = (vType === 'f1' ? 28 : 40) * scale;
      const frontY = drawCenterY + carH * 0.42;
      const hGrad = ctx.createLinearGradient(drawX, frontY, drawX, frontY + beamLen);
      const beamCol = (vType === 'tesla_roadster') ? 'rgba(186, 230, 253, 0.46)' : 'rgba(254, 240, 138, 0.36)';
      hGrad.addColorStop(0.0, beamCol);
      hGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.moveTo(drawX - carW * 0.34, frontY);
      ctx.lineTo(drawX + carW * 0.34, frontY);
      ctx.lineTo(drawX + carW * 0.54, frontY + beamLen);
      ctx.lineTo(drawX - carW * 0.54, frontY + beamLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 7. Transformación del vehículo
    const flightScale = 1.0 + flightLift * 0.34;
    ctx.translate(drawX, drawCenterY);
    ctx.rotate(steerAngle + pirouetteAngle);
    ctx.scale(flightScale, flightScale);

    if (vType === 'f1') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sparkFlicker = (Math.floor(currentTime * 0.04) + noteIdx) % 2 === 0;
      if (sparkFlicker || Math.abs(steerAngle) > 0.02) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = Math.max(1.4, 2.2 * scale);
        ctx.beginPath();
        for (let sp = -1; sp <= 1; sp += 2) {
          const sx = sp * carW * 0.24;
          const sy = -carH * 0.46;
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + sp * 5 * scale, sy - (10 + (currentTime % 9)) * scale);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (vType === 'tesla_roadster') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const jetLen = (flightLift > 0.05 ? 34 : 18) * scale * (0.85 + 0.3 * Math.sin(currentTime * 0.05));
      const jetGrad = ctx.createLinearGradient(0, -carH * 0.45, 0, -carH * 0.45 - jetLen);
      jetGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
      jetGrad.addColorStop(0.45, 'rgba(186, 230, 253, 0.75)');
      jetGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = jetGrad;
      for (let side = -1; side <= 1; side += 2) {
        const jx = side * carW * 0.19;
        ctx.beginPath();
        ctx.moveTo(jx - 4.5 * scale, -carH * 0.44);
        ctx.lineTo(jx + 4.5 * scale, -carH * 0.44);
        ctx.lineTo(jx + side * 7 * scale, -carH * 0.44 - jetLen);
        ctx.lineTo(jx - side * 3 * scale, -carH * 0.44 - jetLen);
        ctx.closePath();
        ctx.fill();
      }
      if (flightLift > 0.08) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${(flightLift * 0.65).toFixed(2)})`;
        ctx.lineWidth = 2.4 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, carW * 0.68, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (sprite) {
      ctx.drawImage(sprite, -carW * 0.5, -carH * 0.5, carW, carH);
    }

    if (vType === 'tractor') {
      const rotAng = currentTime * 0.015;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.78)';
      ctx.beginPath();
      ctx.arc(0, -carH * 0.19, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.lineWidth = 3.0 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -carH * 0.19);
      ctx.lineTo(Math.cos(rotAng) * 16 * scale, -carH * 0.19 + Math.sin(rotAng) * 16 * scale);
      ctx.stroke();
      ctx.restore();
    }

    if (blinkerSide !== 0 && (Math.floor(currentTime * 0.016) % 2 === 0)) {
      ctx.fillStyle = '#fbbf24';
      const bx = blinkerSide * (carW * 0.44);
      ctx.beginPath();
      ctx.arc(bx, carH * 0.36, 4.2 * scale, 0, Math.PI * 2);
      ctx.arc(bx, -carH * 0.36, 4.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderHighwayModeOverlay(ctx, currentTime) {
    if (!this._hwAssetsReady) this.initHighwayModeAssets();
    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._hwLastOverlayNow || nowPerf)) / 1000));
    this._hwLastOverlayNow = nowPerf;

    const w = this.width || 360;
    const h = this.height || 640;

    ctx.save();

    // 1. Renderizar y actualizar partículas de humo blanco con eliminación O(1) swap-and-pop (0 tirones de GC)
    if (this._hwSmokeParticles && this._hwSmokeParticles.length > 0) {
      if (!this._hwSmokeFreePool) this._hwSmokeFreePool = [];
      let len = this._hwSmokeParticles.length;
      for (let i = len - 1; i >= 0; i--) {
        const sp = this._hwSmokeParticles[i];
        sp.age += dt;
        if (sp.age >= sp.duration) {
          this._hwSmokeParticles[i] = this._hwSmokeParticles[len - 1];
          this._hwSmokeParticles.pop();
          len--;
          if (this._hwSmokeFreePool.length < 120) this._hwSmokeFreePool.push(sp);
          continue;
        }
        const p = sp.age / sp.duration;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        const curR = sp.r + (sp.maxR - sp.r) * (1 - (1 - p) * (1 - p));
        const curAlpha = sp.alpha * (1 - p);

        ctx.globalAlpha = Math.max(0, Math.min(1, curAlpha));
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, curR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Cartel luminoso de apertura del Modo Carretera
    if (this._hwBannerTimer > 0 && this._hwBannerText) {
      this._hwBannerTimer = Math.max(0, this._hwBannerTimer - dt);
      const alpha = Math.min(1, this._hwBannerTimer * 1.5);
      ctx.globalAlpha = alpha;
      const bannerY = h * 0.23;
      const bw = Math.min(w - 20, 342);
      const bh = 34;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh, 12);
      else ctx.rect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 11.5px "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fde047';
      ctx.fillText(this._hwBannerText, w * 0.5, bannerY);
    }

    ctx.restore();
  }

  // =========================================================================
  // MODO PERRO MOLESTO (POMERANIAN ZORRITO MARRÓN CON PECHERA Y COLA BLANCA)
  // =========================================================================

  initAnnoyingDogModeAssets() {
    if (this._dogAssetsReady && this._dogSteakSprites && this._dogPoopSprite && this._dogPawPrintSprite) return;
    this._dogAssetsReady = true;
    this._dogSteaks = this._dogSteaks || [];
    this._dogSitSchedule = this._dogSitSchedule || [];
    this._dogPawPrints = [];
    this._dogPoops = [];
    this._dogFxParticles = [];
    this._dogFxFreePool = [];
    this._dogState = {
      lane: 1.0,
      p: 0.50,
      vx: 0,
      vy: 0,
      pose: 'sitting', // 'sitting' | 'chasing' | 'swiping' | 'eating' | 'zoomies'
      facingDir: 1,
      swipeTimer: 0,
      eatTimer: 0,
      eatTotalDur: 0.72,
      eatingSteak: null,
      lastBiteStage: -1,
      steaksEaten: 0,
      maxSteaksForFrenzy: 10,
      bellyBounceTimer: 0,
      zoomiesTimer: 0,
      zoomiesTotalDur: 6.2,
      lastPoopMs: 0,
      barkText: '🐶 ¡GUAU! ¡QUIERO ENTRECOT!',
      barkTimer: 2.2,
      lastStepMs: 0
    };

    if (typeof document === 'undefined') return;

    // 1. Tres Sprites de GRAN ENTRECOT / CHULETÓN T-BONE GOURMET ULTRA DETALLADO
    // (Fase 0: Entrecot entero recién hecho, Fase 1: Medio devorado con mordiscos, Fase 2: Hueso en T de marfil pelado)
    this._dogSteakSprites = [];
    for (let stage = 0; stage < 3; stage++) {
      const stCvs = document.createElement('canvas');
      stCvs.width = 220;
      stCvs.height = 176;
      const sc = stCvs.getContext('2d');
      const scx = 110, scy = 90;

      // Halo cálido apetitoso dorado-rubí bajo el gran entrecot
      const glowG = sc.createRadialGradient(scx, scy, 16, scx, scy, 98);
      glowG.addColorStop(0.0, 'rgba(251, 191, 36, 0.78)');
      glowG.addColorStop(0.50, 'rgba(239, 68, 68, 0.40)');
      glowG.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
      sc.fillStyle = glowG;
      sc.beginPath();
      sc.arc(scx, scy, 98, 0, Math.PI * 2);
      sc.fill();

      sc.save();
      sc.translate(scx, scy);
      sc.rotate(-0.08);

      // Función auxiliar que traza la silueta anatómica real de un Gran Entrecot / Chuletón (forma arriñonada ancha con punta de lomo y solomillo)
      const traceEntrecotPath = (ctx, yOff = 0, scale = 1.0) => {
        ctx.beginPath();
        ctx.moveTo(-72 * scale, (-14 + yOff) * scale);
        // Lomo superior convexo con capa de grasa dorada
        ctx.bezierCurveTo(-76 * scale, (-44 + yOff) * scale, -22 * scale, (-54 + yOff) * scale, 26 * scale, (-46 + yOff) * scale);
        // Punta derecha redondeada del entrecot
        ctx.bezierCurveTo(68 * scale, (-38 + yOff) * scale, 82 * scale, (-6 + yOff) * scale, 70 * scale, (24 + yOff) * scale);
        // Curva inferior con hendidura natural del hueso central
        ctx.bezierCurveTo(56 * scale, (48 + yOff) * scale, 16 * scale, (46 + yOff) * scale, -4 * scale, (36 + yOff) * scale);
        // Lóbulo izquierdo del solomillo
        ctx.bezierCurveTo(-28 * scale, (46 + yOff) * scale, -68 * scale, (32 + yOff) * scale, -72 * scale, (-14 + yOff) * scale);
        ctx.closePath();
      };

      if (stage < 2) {
        // Si stage === 1 (primer gran bocado del perro), recortamos dos mordiscos dentados grandes en el lado derecho
        if (stage === 1) {
          sc.beginPath();
          sc.rect(-110, -90, 160, 176);
          sc.arc(52, -16, 32, 0, Math.PI * 2, true);
          sc.arc(46, 22, 30, 0, Math.PI * 2, true);
          sc.clip();
        }

        // 1A. Sombra proyectada 3D sobre la pista
        sc.fillStyle = 'rgba(0, 0, 0, 0.55)';
        traceEntrecotPath(sc, 16, 1.03);
        sc.fill();

        // 1B. Pared lateral 3D gruesa de corteza asada a la parrilla (grosor de chuletón de 4 dedos)
        const sideGrad = sc.createLinearGradient(-74, -20, 74, 48);
        sideGrad.addColorStop(0.0, '#451a03');
        sideGrad.addColorStop(0.45, '#78350f');
        sideGrad.addColorStop(0.8, '#571e05');
        sideGrad.addColorStop(1.0, '#290e02');
        sc.fillStyle = sideGrad;
        for (let d = 12; d >= 1; d -= 2) {
          traceEntrecotPath(sc, d, 1.0);
          sc.fill();
        }

        // Textura vertical de sellado de parrilla en el canto grueso 3D de la carne
        sc.strokeStyle = 'rgba(24, 8, 1, 0.65)';
        sc.lineWidth = 2.4;
        for (let sx = -58; sx <= 58; sx += 14) {
          sc.beginPath();
          sc.moveTo(sx, 28);
          sc.lineTo(sx - 2, 44);
          sc.stroke();
        }

        // 1C. Borde exterior de grasa infiltrada dorada y crujiente (típica cobertura de grasa del Entrecot)
        const fatRimGrad = sc.createLinearGradient(-74, -50, 74, 30);
        fatRimGrad.addColorStop(0.0, '#fef08a');
        fatRimGrad.addColorStop(0.35, '#fde047');
        fatRimGrad.addColorStop(0.70, '#facc15');
        fatRimGrad.addColorStop(1.0, '#eab308');
        sc.fillStyle = fatRimGrad;
        traceEntrecotPath(sc, 0, 1.0);
        sc.fill();
        sc.strokeStyle = '#92400e';
        sc.lineWidth = 2.6;
        sc.stroke();

        // 1D. Superficie interior de carne roja jugosa al punto (Medium-Rare Ruby)
        const meatGrad = sc.createRadialGradient(-8, -6, 8, 0, 0, 72);
        meatGrad.addColorStop(0.0, '#f43f5e'); // Centro tierno jugoso rosado-rubí
        meatGrad.addColorStop(0.45, '#e11d48');
        meatGrad.addColorStop(0.78, '#be123c');
        meatGrad.addColorStop(1.0, '#7f1d1d'); // Borde caramelizado Maillard
        sc.fillStyle = meatGrad;
        traceEntrecotPath(sc, 1, 0.89);
        sc.fill();

        // 1E. Ojo de grasa nacarada intramuscular y veteado Wagyu hiper-detallado en ambos músculos
        sc.save();
        traceEntrecotPath(sc, 1, 0.88);
        sc.clip();

        // Venas principales de veteado blanco-crema
        sc.strokeStyle = 'rgba(254, 249, 195, 0.82)';
        sc.lineWidth = 2.5;
        sc.lineCap = 'round';
        sc.beginPath();
        // Lado izquierdo (Solomillo)
        sc.moveTo(-56, -14); sc.quadraticCurveTo(-36, -6, -20, -24);
        sc.moveTo(-42, -9);  sc.quadraticCurveTo(-30, 6, -22, 16);
        sc.moveTo(-54, 12);  sc.quadraticCurveTo(-36, 18, -18, 6);
        // Lado derecho (Lomo alto del Entrecot)
        sc.moveTo(8, -28);   sc.quadraticCurveTo(28, -14, 52, -22);
        sc.moveTo(26, -18);  sc.quadraticCurveTo(38, -2, 58, -4);
        sc.moveTo(10, 8);    sc.quadraticCurveTo(32, 18, 56, 10);
        sc.moveTo(28, 14);   sc.quadraticCurveTo(40, 28, 48, 24);
        sc.stroke();

        // Venas secundarias finas de infiltración
        sc.strokeStyle = 'rgba(254, 240, 138, 0.55)';
        sc.lineWidth = 1.4;
        sc.beginPath();
        sc.moveTo(-48, -28); sc.lineTo(-32, -18);
        sc.moveTo(-34, 22);  sc.lineTo(-16, 20);
        sc.moveTo(16, -6);   sc.lineTo(42, 4);
        sc.moveTo(18, 24);   sc.lineTo(36, 18);
        sc.stroke();

        // 1F. Marcas de parrilla al carbón en rombo (Char-Grill Crosshatch) bien marcadas
        sc.strokeStyle = 'rgba(28, 10, 2, 0.68)';
        sc.lineWidth = 4.0;
        for (let g = -64; g <= 64; g += 15) {
          sc.beginPath();
          sc.moveTo(g - 18, -46);
          sc.lineTo(g + 18, 42);
          sc.stroke();
        }
        sc.strokeStyle = 'rgba(41, 14, 3, 0.46)';
        sc.lineWidth = 3.0;
        for (let g = -64; g <= 64; g += 18) {
          sc.beginPath();
          sc.moveTo(g + 18, -46);
          sc.lineTo(g - 18, 42);
          sc.stroke();
        }
        sc.restore();
      } else {
        // Stage 2: Quedan solo hebras de carne asada adheridas al hueso en T antes de tragar
        sc.fillStyle = '#be123c';
        sc.beginPath();
        sc.arc(-16, -6, 13, 0, Math.PI * 2);
        sc.arc(14, 7, 11, 0, Math.PI * 2);
        sc.arc(-6, 16, 9, 0, Math.PI * 2);
        sc.fill();
      }

      // 1G. Hueso anatómico en T blanco marfil con medallón de tuétano (separa el lomo del solomillo)
      sc.lineCap = 'round';
      sc.lineJoin = 'round';
      // Contorno tostado del hueso
      sc.strokeStyle = '#78350f';
      sc.lineWidth = 14.0;
      sc.beginPath();
      sc.moveTo(-36, -24);
      sc.quadraticCurveTo(-4, -18, 32, -22);
      sc.moveTo(-4, -20);
      sc.quadraticCurveTo(-8, 6, -12, 34);
      sc.stroke();

      // Hueso blanco marfil brillante
      sc.strokeStyle = '#fffbeb';
      sc.lineWidth = 9.5;
      sc.beginPath();
      sc.moveTo(-36, -24);
      sc.quadraticCurveTo(-4, -18, 32, -22);
      sc.moveTo(-4, -20);
      sc.quadraticCurveTo(-8, 6, -12, 34);
      sc.stroke();

      // Anillo de tuétano vertebral en la intersección de la T
      sc.fillStyle = '#fef3c7';
      sc.strokeStyle = '#92400e';
      sc.lineWidth = 2.4;
      sc.beginPath();
      sc.arc(-5, -19, 9.5, 0, Math.PI * 2);
      sc.fill();
      sc.stroke();
      sc.fillStyle = '#b91c1c';
      sc.beginPath();
      sc.arc(-5, -19, 4.5, 0, Math.PI * 2);
      sc.fill();

      if (stage === 0) {
        // 1H. Medallón de mantequilla Maître d'Hôtel fundiéndose + Ramita de romero fresco + Escamas de sal Maldon
        sc.fillStyle = 'rgba(254, 240, 138, 0.42)';
        sc.beginPath();
        sc.ellipse(22, -2, 24, 15, 0.15, 0, Math.PI * 2);
        sc.fill();

        sc.fillStyle = '#fde047';
        sc.strokeStyle = '#ca8a04';
        sc.lineWidth = 1.8;
        sc.beginPath();
        sc.ellipse(20, -4, 14, 9.5, 0.20, 0, Math.PI * 2);
        sc.fill();
        sc.stroke();

        // Ramita de romero fresco sobre el entrecot
        sc.strokeStyle = '#15803d';
        sc.lineWidth = 2.4;
        sc.beginPath();
        sc.moveTo(6, -10);
        sc.quadraticCurveTo(22, -4, 36, 4);
        sc.stroke();
        sc.fillStyle = '#22c55e';
        for (let lf = 0; lf < 5; lf++) {
          const lx = 10 + lf * 5.5;
          const ly = -8 + lf * 2.4;
          sc.beginPath();
          sc.ellipse(lx, ly - 3.5, 4.2, 1.7, -0.5, 0, Math.PI * 2);
          sc.ellipse(lx, ly + 3.5, 4.2, 1.7, 0.5, 0, Math.PI * 2);
          sc.fill();
        }

        // Destellos especulares húmedos de jugo y cristales de sal en escamas
        sc.fillStyle = 'rgba(255, 255, 255, 0.85)';
        sc.beginPath();
        sc.ellipse(-34, -22, 9, 3.4, -0.25, 0, Math.PI * 2);
        sc.ellipse(38, -20, 8, 3.0, 0.25, 0, Math.PI * 2);
        sc.arc(-26, 12, 2.2, 0, Math.PI * 2);
        sc.arc(32, 16, 2.0, 0, Math.PI * 2);
        sc.arc(44, -6, 1.8, 0, Math.PI * 2);
        sc.fill();
      }

      sc.restore();
      this._dogSteakSprites.push(stCvs);
    }
    this._dogSteakSprite = this._dogSteakSprites[0];

    // 2. Sprite de Caca Olorosa 3D con Brillo Cartoon (💩)
    const poopCvs = document.createElement('canvas');
    poopCvs.width = 96;
    poopCvs.height = 96;
    const ppc = poopCvs.getContext('2d');
    const pcx = 48, pcy = 56;

    // Aura verde-ámbar de hedor cómico alrededor de la caca
    const stinkGlow = ppc.createRadialGradient(pcx, pcy - 4, 6, pcx, pcy - 4, 44);
    stinkGlow.addColorStop(0.0, 'rgba(163, 230, 53, 0.38)');
    stinkGlow.addColorStop(0.6, 'rgba(101, 163, 13, 0.16)');
    stinkGlow.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ppc.fillStyle = stinkGlow;
    ppc.beginPath();
    ppc.arc(pcx, pcy - 4, 44, 0, Math.PI * 2);
    ppc.fill();

    // Sombra en el suelo
    ppc.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ppc.beginPath();
    ppc.ellipse(pcx, pcy + 18, 30, 11, 0, 0, Math.PI * 2);
    ppc.fill();

    // 3 pisos en espiral de caca estilo cartoon brillante (#451a03 -> #78350f -> #92400e)
    const coils = [
      { y: pcy + 10, rx: 26, ry: 10.5 },
      { y: pcy - 1,  rx: 20, ry: 9.0 },
      { y: pcy - 11, rx: 13.5, ry: 7.5 }
    ];
    for (let c = 0; c < coils.length; c++) {
      const cl = coils[c];
      const cg = ppc.createLinearGradient(pcx - cl.rx, cl.y - cl.ry, pcx + cl.rx, cl.y + cl.ry);
      cg.addColorStop(0.0, '#92400e');
      cg.addColorStop(0.55, '#713f12');
      cg.addColorStop(1.0, '#3f1d06');
      ppc.fillStyle = cg;
      ppc.strokeStyle = '#271001';
      ppc.lineWidth = 2.6;
      ppc.beginPath();
      ppc.ellipse(pcx, cl.y, cl.rx, cl.ry, 0, 0, Math.PI * 2);
      ppc.fill();
      ppc.stroke();

      // Brillo especular cartoon en cada vuelta
      ppc.fillStyle = 'rgba(254, 243, 199, 0.42)';
      ppc.beginPath();
      ppc.ellipse(pcx - cl.rx * 0.42, cl.y - cl.ry * 0.32, cl.rx * 0.25, cl.ry * 0.24, -0.25, 0, Math.PI * 2);
      ppc.fill();
    }

    // Punta rizada superior
    ppc.fillStyle = '#78350f';
    ppc.strokeStyle = '#271001';
    ppc.lineWidth = 2.4;
    ppc.beginPath();
    ppc.moveTo(pcx - 8, pcy - 15);
    ppc.quadraticCurveTo(pcx - 2, pcy - 32, pcx + 7, pcy - 28);
    ppc.quadraticCurveTo(pcx + 3, pcy - 18, pcx + 8, pcy - 15);
    ppc.closePath();
    ppc.fill();
    ppc.stroke();

    this._dogPoopSprite = poopCvs;

    // 3. Sprite de Huella de Patita Dorada (🐾)
    const pawCvs = document.createElement('canvas');
    pawCvs.width = 56;
    pawCvs.height = 56;
    const pc = pawCvs.getContext('2d');
    pc.translate(28, 28);
    pc.fillStyle = '#f59e0b';
    pc.strokeStyle = '#451a03';
    pc.lineWidth = 2.2;
    pc.beginPath();
    pc.ellipse(0, 6, 11, 8.5, 0, 0, Math.PI * 2);
    pc.fill();
    pc.stroke();
    const toes = [
      { x: -11, y: -5, a: -0.35 },
      { x: -4,  y: -10, a: -0.12 },
      { x: 4,   y: -10, a: 0.12 },
      { x: 11,  y: -5, a: 0.35 }
    ];
    for (let i = 0; i < toes.length; i++) {
      const t = toes[i];
      pc.save();
      pc.translate(t.x, t.y);
      pc.rotate(t.a);
      pc.beginPath();
      pc.ellipse(0, 0, 4.2, 5.8, 0, 0, Math.PI * 2);
      pc.fill();
      pc.stroke();
      pc.restore();
    }
    this._dogPawPrintSprite = pawCvs;
  }

  _prepareAnnoyingDogChoreography() {
    if (!this.notes || this.notes.length === 0) return;
    const nLen = this.notes.length;
    this._dogSteaks = [];
    this._dogSitSchedule = [];
    this._dogPoops = [];
    this._dogPawPrints = [];
    if (this._dogState) {
      this._dogState.steaksEaten = 0;
      this._dogState.zoomiesTimer = 0;
      this._dogState.eatTimer = 0;
      this._dogState.eatingSteak = null;
      this._dogState.bellyBounceTimer = 0;
      this._dogState.pose = 'sitting';
    }

    // 1. Seleccionar teclas objetivo que el Pomeranian cambiará de carril de un zarpazo (~38% de taps bien espaciados)
    // El zarpazo ocurre cuando la tecla va por p ≈ 0.38–0.46, y el chuletón baja más (eatP ≈ 0.56–0.66) para que se vea mucho más tiempo y el perro estorbe de verdad
    let lastBattedTimeMs = -9999;
    for (let i = 0; i < nLen; i++) {
      const n = this.notes[i];
      n._dogBatted = false;
      n._dogFromLane = n.lane ?? 1;
      n._dogSwipeP = 0.40;
      n._dogSwipeTriggered = false;

      if (!n || n.type === 'hold') continue;
      const curT = n.timestamp_ms ?? 0;
      const prevT = i > 0 ? (this.notes[i - 1].timestamp_ms ?? 0) : -9999;
      const nextT = i + 1 < nLen ? (this.notes[i + 1].timestamp_ms ?? 9999999) : 9999999;

      if (curT > 2000 && (curT - lastBattedTimeMs >= 1350) && (curT - prevT >= 220) && (nextT - curT >= 220)) {
        const trueLane = Math.max(0, Math.min(2, Math.round(n.lane ?? 1)));
        let originLane = trueLane === 1 ? ((i % 2 === 0) ? 0 : 2) : 1;
        n._dogBatted = true;
        n._dogFromLane = originLane;
        n._dogSwipeP = 0.38 + (i % 3) * 0.03; // p = 0.38 .. 0.44
        lastBattedTimeMs = curT;

        // El Chuletón T-Bone baja hasta p = 0.56..0.66 antes de que el perro lo atrape y lo mastique
        this._dogSteaks.push({
          id: 'steak_bat_' + i,
          lane: trueLane,
          originLane: originLane,
          hitTimeMs: curT + 220,
          eatP: Math.min(0.66, n._dogSwipeP + 0.20),
          eaten: false,
          beingEaten: false,
          linkedNoteIdx: i
        });
      }
    }

    // 2. Añadir chuletones frecuentes (cada ~1450ms si hay hueco) para que el jugador vea claramente al perro engordar de 0 a 10 chuletones y entrar en frenesí de cacas
    const firstT = Math.max(1800, (this.notes[0]?.timestamp_ms || 1800));
    const lastT = this.lastNoteTime || 60000;
    let cursorMs = firstT + 600;
    let stepIdx = 0;

    while (cursorMs < lastT - 1000) {
      const hasNearbySteak = this._dogSteaks.some(s => Math.abs(s.hitTimeMs - cursorMs) < 1150);
      if (!hasNearbySteak) {
        if (stepIdx % 3 !== 2) {
          const stLane = (stepIdx * 2 + 1) % 3;
          this._dogSteaks.push({
            id: 'steak_extra_' + stepIdx,
            lane: stLane,
            originLane: stLane,
            hitTimeMs: cursorMs,
            eatP: 0.56 + (stepIdx % 3) * 0.05, // Baja hasta p = 0.56..0.66 para verse grande y sabroso
            eaten: false,
            beingEaten: false,
            linkedNoteIdx: -1
          });
        } else {
          // El perro se sienta en medio-bajo de una columna tapando aún más visión cuanto más gordo está
          const sitLane = (stepIdx + 1) % 3;
          this._dogSitSchedule.push({
            startMs: cursorMs - 550,
            endMs: cursorMs + 1350,
            lane: sitLane,
            p: 0.55
          });
        }
      }
      cursorMs += 1450;
      stepIdx++;
    }

    this._dogSteaks.sort((a, b) => a.hitTimeMs - b.hitTimeMs);
  }

  _emitDogFxParticle(x, y, vx, vy, kind, text, color, size, duration) {
    if (!this._dogFxParticles) this._dogFxParticles = [];
    if (!this._dogFxFreePool) this._dogFxFreePool = [];
    if (this._dogFxParticles.length >= 75) return;
    const pt = this._dogFxFreePool.length > 0 ? this._dogFxFreePool.pop() : {};
    pt.x = x;
    pt.y = y;
    pt.vx = vx;
    pt.vy = vy;
    pt.kind = kind || 'heart';
    pt.text = text || '';
    pt.color = color || '#fb7185';
    pt.size = size || 14;
    pt.age = 0;
    pt.duration = duration || 0.65;
    this._dogFxParticles.push(pt);
  }

  // Dibujo procedural ultra-detallado del Pomeranian marrón grande tipo zorrito (fiel a las fotos reales del usuario)
  // Soporta engorde progresivo (chubbyLevel de 0 a 10 chuletones) y animación de devorar el chuletón a bocados en la boca
  _drawPomeranianDog(ctx, x, y, scale, pose, facingDir, currentTime, swipeProgress = 0, chubbyLevel = 0, eatProgress = 0, bellyBounce = 0) {
    ctx.save();
    ctx.translate(x, y);

    const t = currentTime * 0.001;
    const isRunning = (pose === 'chasing' || pose === 'zoomies');
    const isZoomies = (pose === 'zoomies');
    const isSwiping = (pose === 'swiping');
    const isEating = (pose === 'eating');
    const isSitting = (pose === 'sitting');

    // Factor de gordura progresivo (de 0 a 10 chuletones): ensancha la barriga y el manto esponjoso hasta hacerlo una bola gigante adorable
    const fatRatio = Math.max(0, Math.min(1.2, chubbyLevel / 10));
    const bounceSquash = bellyBounce > 0 ? Math.sin(bellyBounce * Math.PI * 3) * 0.16 : 0;
    const chubbyMultX = 1.0 + fatRatio * 1.15 + bounceSquash;
    const chubbyMultY = 1.0 + fatRatio * 0.68 - bounceSquash * 0.5;

    const runFreq = isZoomies ? 28.0 : 17.5;
    const bobY = isRunning
      ? -Math.abs(Math.sin(t * runFreq)) * ((isZoomies ? 13.5 : 9.5) * scale)
      : (isEating ? Math.sin(t * 28.0) * (4.5 * scale) : Math.sin(t * 4.5) * (2.2 * scale));
    const bodyTilt = isRunning
      ? (facingDir * (isZoomies ? 0.22 : 0.14) + Math.cos(t * runFreq) * (isZoomies ? 0.12 : 0.06))
      : (isSwiping ? facingDir * 0.22 : Math.sin(t * 2.8) * 0.04);

    // 1. Sombra elíptica suave sobre la pista bajo el perrito (crece con la barriga)
    ctx.fillStyle = isSitting ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    const shRx = (isSitting ? 48 : 42) * chubbyMultX * scale;
    const shRy = (isSitting ? 22 : 18) * chubbyMultY * scale;
    ctx.ellipse(0, (26 + fatRatio * 8) * scale, shRx, shRy, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bobY);
    ctx.rotate(bodyTilt);

    // 2. ENORME COLA PLUMERO BLANCA CREMA ESPONJOSA (rasgo icónico de las fotos 1 y 2)
    const wagSpeed = (isEating || isSwiping || isZoomies) ? 30.0 : (isRunning ? 20.0 : 9.5);
    const wagAngle = Math.sin(t * wagSpeed) * (isEating || isZoomies ? 0.44 : 0.26);
    ctx.save();
    ctx.translate(-facingDir * (14 + fatRatio * 14) * scale, (-18 - fatRatio * 6) * scale);
    ctx.rotate(wagAngle - facingDir * 0.18);

    const plumeColors = ['#fde68a', '#fef3c7', '#fffbeb', '#ffffff'];
    for (let layer = 0; layer < plumeColors.length; layer++) {
      ctx.fillStyle = plumeColors[layer];
      const rad = (29 - layer * 3.5) * (1 + fatRatio * 0.25) * scale;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2;
        const tuftR = rad * (0.85 + 0.22 * Math.sin(k * 3.1 + layer));
        const px = Math.cos(ang) * tuftR * 1.12;
        const py = -12 * scale + Math.sin(ang) * tuftR * 0.92;
        if (k === 0) ctx.moveTo(px + 7 * scale, py);
        ctx.arc(px, py, (9.2 - layer * 1.1) * scale, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.restore();

    // 3. PATITAS TRASERAS CON CALCETINES BLANCOS (se separan más a medida que engorda la barriga)
    const legSwing = isRunning ? Math.sin(t * runFreq) * ((isZoomies ? 15 : 11) * scale) : 0;
    for (let side = -1; side <= 1; side += 2) {
      const lx = side * (22 * chubbyMultX * 0.88) * scale;
      const ly = (20 * chubbyMultY + (side * legSwing * 0.45)) * scale;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(lx, ly - 5 * scale, (9 + fatRatio * 4) * scale, 11 * scale, side * (0.2 + fatRatio * 0.18), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = Math.max(1.2, 1.8 * scale);
      ctx.beginPath();
      ctx.ellipse(lx + side * 2 * scale, ly + 4 * scale, 7.8 * scale, 5.4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 4. MANTO ESPONJOSO MARRÓN CANELA / ZORRITO DORADO Y BARRIGA REDONDA GIGANTE
    const coatLayers = [
      { col: '#9a3412', rx: 40, ry: 33, yOff: 2 },
      { col: '#c2410c', rx: 37, ry: 31, yOff: 1 },
      { col: '#d97706', rx: 34, ry: 28, yOff: 0 },
      { col: '#f59e0b', rx: 29, ry: 24, yOff: -1 }
    ];
    for (let cl = 0; cl < coatLayers.length; cl++) {
      const L = coatLayers[cl];
      ctx.fillStyle = L.col;
      ctx.beginPath();
      const tufts = 18;
      for (let i = 0; i < tufts; i++) {
        const a = (i / tufts) * Math.PI * 2;
        const tx = Math.cos(a) * L.rx * chubbyMultX * scale;
        const ty = (L.yOff + fatRatio * 5 + Math.sin(a) * L.ry * chubbyMultY) * scale;
        const rTuft = (11.8 - cl * 1.3) * (1 + fatRatio * 0.38) * scale;
        ctx.moveTo(tx + rTuft, ty);
        ctx.arc(tx, ty, rTuft, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // 5. GRAN PECHERA Y BARRIGUITA BLANCA ESPONJOSA (crece enormemente con cada chuletón comido)
    const bibLayers = [
      { col: '#fef3c7', rx: 23, ry: 20, yOff: 5 },
      { col: '#fffbeb', rx: 20, ry: 17, yOff: 4 },
      { col: '#ffffff', rx: 16, ry: 14, yOff: 3 }
    ];
    for (let bl = 0; bl < bibLayers.length; bl++) {
      const B = bibLayers[bl];
      ctx.fillStyle = B.col;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const bx = Math.cos(a) * B.rx * (1.0 + fatRatio * 1.05) * scale;
        const by = (B.yOff + fatRatio * 6 + Math.sin(a) * B.ry * (1.0 + fatRatio * 0.72)) * scale;
        const rB = (8.8 - bl * 1.2) * (1 + fatRatio * 0.35) * scale;
        ctx.moveTo(bx + rB, by);
        ctx.arc(bx, by, rB, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Si está muy gordito (>= 4 chuletones), dibujar líneas curvas de barriga llena adorable
    if (chubbyLevel >= 4) {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.38)';
      ctx.lineWidth = Math.max(1.5, 2.4 * scale);
      ctx.beginPath();
      ctx.arc(0, (8 + fatRatio * 6) * scale, (18 + fatRatio * 18) * scale, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }

    // 6. PATITAS DELANTERAS CON CALCETINES BLANCOS (y animación de ZARPAZO o de sujetar el chuletón al comer)
    for (let side = -1; side <= 1; side += 2) {
      const isSwipingPaw = isSwiping && (side === (facingDir >= 0 ? 1 : -1));
      ctx.save();
      if (isSwipingPaw) {
        const swipeArc = Math.sin(swipeProgress * Math.PI);
        const pawX = side * (22 * chubbyMultX * 0.8 + swipeArc * 28) * scale;
        const pawY = (6 - swipeArc * 22) * scale;
        ctx.translate(pawX, pawY);
        ctx.rotate(side * (-0.75 - swipeArc * 0.9));

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = Math.max(2.5, 4.5 * scale);
        ctx.beginPath();
        ctx.arc(-side * 10 * scale, 4 * scale, 22 * scale, -0.7, 0.9);
        ctx.stroke();

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8 * scale, 13 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = Math.max(1.5, 2.2 * scale);
        ctx.beginPath();
        ctx.ellipse(0, 10 * scale, 9.5 * scale, 7.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(0, 11 * scale, 3.2 * scale, 0, Math.PI * 2);
        ctx.fill();
      } else if (isEating) {
        // Cuando devora el chuletón, junta las dos patitas delanteras blancas para sujetar el hueso T-Bone
        const holdX = side * 12 * scale;
        const holdY = 8 * scale + Math.sin(t * 32.0 + side) * (2.5 * scale);
        ctx.translate(holdX, holdY);
        ctx.rotate(-side * 0.45);
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(0, -3 * scale, 7 * scale, 9 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = Math.max(1.4, 2.0 * scale);
        ctx.beginPath();
        ctx.ellipse(0, 4 * scale, 7.8 * scale, 5.8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        const stepY = isRunning ? (side * legSwing) : 0;
        const fx = side * (14 * (1 + fatRatio * 0.55)) * scale;
        const fy = (22 * chubbyMultY + stepY * 0.65) * scale;
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(fx, fy - 5 * scale, 6.8 * scale, 9.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = Math.max(1.2, 1.8 * scale);
        ctx.beginPath();
        ctx.ellipse(fx, fy + 4 * scale, 7.0 * scale, 5.2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. CABEZA DE ZORRITO POMERANIAN (con mofletes que también se ponen rechonchos al comer y sacudida al masticar el chuletón)
    ctx.save();
    const headTilt = isSitting
      ? Math.sin(t * 3.4) * 0.15
      : (isEating ? Math.sin(t * 36.0) * 0.24 : (isZoomies ? Math.sin(t * 24.0) * 0.18 : facingDir * 0.08));
    ctx.translate(0, (-14 - fatRatio * 3) * scale);
    ctx.rotate(headTilt);

    const cheekFat = 1.0 + fatRatio * 0.26;

    // A. Orejitas triangulares puntiagudas de zorrito
    for (let side = -1; side <= 1; side += 2) {
      const earTwitch = Math.sin(t * (isZoomies ? 18.0 : 6.5) + (side > 0 ? 1.2 : 0)) * (isZoomies ? 0.18 : 0.08);
      ctx.save();
      ctx.translate(side * 16 * cheekFat * scale, -15 * scale);
      ctx.rotate(side * 0.24 + earTwitch);

      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = Math.max(1.3, 2.0 * scale);
      ctx.beginPath();
      ctx.moveTo(-9 * scale, 4 * scale);
      ctx.lineTo(0, -17 * scale);
      ctx.lineTo(9 * scale, 4 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(-5 * scale, 2 * scale);
      ctx.lineTo(0, -11 * scale);
      ctx.lineTo(5 * scale, 2 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // B. Mejillas esponjosas de zorrito y cráneo dorado
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24 * cheekFat * scale, 19 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    for (let side = -1; side <= 1; side += 2) {
      ctx.moveTo(side * 22 * cheekFat * scale, 2 * scale);
      ctx.lineTo(side * 30 * cheekFat * scale, -1 * scale);
      ctx.lineTo(side * 26 * cheekFat * scale, 7 * scale);
      ctx.lineTo(side * 31 * cheekFat * scale, 10 * scale);
      ctx.lineTo(side * 19 * cheekFat * scale, 11 * scale);
    }
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, 1 * scale, 19 * cheekFat * scale, 15.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // C. Cejas expresivas color crema claro
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(-7.5 * scale, -6.5 * scale, 3.8 * scale, 2.0 * scale, -0.2, 0, Math.PI * 2);
    ctx.ellipse(7.5 * scale, -6.5 * scale, 3.8 * scale, 2.0 * scale, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // D. Ojos oscuros brillantes y traviesos (o cerrados de placer al masticar el chuletón)
    const isBlinking = ((Math.floor(t * 2.2) % 9) === 0) && ((t % 0.45) < 0.11);
    for (let side = -1; side <= 1; side += 2) {
      const ex = side * 8.2 * scale;
      const ey = -2.2 * scale;
      if (isBlinking || (isEating && Math.sin(t * 28.0) > 0.2)) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = Math.max(1.8, 2.6 * scale);
        ctx.beginPath();
        ctx.arc(ex, ey, 3.8 * scale, Math.PI + 0.2, Math.PI * 2 - 0.2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ex, ey, (isZoomies ? 4.6 : 4.1) * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 1.3 * scale, ey - 1.4 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.arc(ex + 1.2 * scale, ey + 1.0 * scale, 0.75 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // E. Hocico cónico de zorrito con comisura negra sonriente y lengüita rosa
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, 6.5 * scale, 9.5 * scale, 7.0 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const mouthOpen = isEating ? (1.25 + 0.45 * Math.sin(t * 38.0)) : (isZoomies ? 1.2 : (0.85 + 0.18 * Math.sin(t * 11.0)));
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(0, 6.8 * scale, 6.2 * scale * mouthOpen, 0.08, Math.PI - 0.08);
    ctx.fill();

    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.ellipse(1.5 * scale, (10.5 + Math.sin(t * (isZoomies ? 24.0 : 12.0)) * 1.3) * scale, 3.8 * scale, 4.6 * scale * mouthOpen, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1.5, 2.2 * scale);
    ctx.beginPath();
    ctx.arc(-3.5 * scale, 5.8 * scale, 4.2 * scale, 0.2, Math.PI * 0.85);
    ctx.arc(3.5 * scale, 5.8 * scale, 4.2 * scale, Math.PI * 0.15, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.ellipse(0, 3.5 * scale, 4.4 * scale, 3.2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-1.2 * scale, 2.6 * scale, 1.5 * scale, 0.9 * scale, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // F. CHULETÓN GIGANTE EN LAS FAUCES DEL PERRO MIENTRAS LO DEVORA A BOCADOS (3 FASES DE MORDISCO)
    if (isEating && this._dogSteakSprites && this._dogSteakSprites.length === 3) {
      const biteStage = eatProgress < 0.36 ? 0 : (eatProgress < 0.72 ? 1 : 2);
      const steakImg = this._dogSteakSprites[biteStage];
      const chompScale = (1.0 - eatProgress * 0.18) * (1.0 + 0.14 * Math.sin(t * 42.0));
      const stW = 98 * scale * chompScale;
      const stH = 78 * scale * chompScale;
      ctx.save();
      ctx.translate(0, 15 * scale);
      ctx.rotate(Math.sin(t * 42.0) * 0.22);
      ctx.drawImage(steakImg, -stW * 0.5, -stH * 0.5, stW, stH);
      ctx.restore();
    }

    ctx.restore(); // Fin cabeza
    ctx.restore(); // Fin perro
  }

  // Dibuja una caca olorosa sobre la pista con humo verde ondulante y moscas animadas revoloteando alrededor
  _drawSmellyPoopWithFlies(ctx, x, y, scale, age, duration, currentTime, seed) {
    const fadeOut = age > duration - 0.8 ? Math.max(0, (duration - age) / 0.8) : 1.0;
    const popIn = age < 0.22 ? (0.4 + 0.6 * Math.sin((age / 0.22) * (Math.PI * 0.5))) : 1.0;
    const t = currentTime * 0.001;

    ctx.save();
    ctx.globalAlpha = fadeOut;
    ctx.translate(x, y);

    // 1. Sprite de la caca con ligero latido cómico
    const squishX = popIn * (1.0 + Math.sin(t * 5.0 + seed) * 0.04);
    const squishY = popIn * (1.0 - Math.sin(t * 5.0 + seed) * 0.04);
    const pSize = Math.max(28, 66 * scale);
    if (this._dogPoopSprite) {
      ctx.save();
      ctx.scale(squishX, squishY);
      ctx.drawImage(this._dogPoopSprite, -pSize * 0.5, -pSize * 0.58, pSize, pSize);
      ctx.restore();
    }

    // 2. Tres ondas de hedor verde-lima/ámbar ascendiendo y serpenteando sobre la caca
    ctx.lineCap = 'round';
    for (let wIdx = 0; wIdx < 3; wIdx++) {
      const wavePhase = (t * 1.6 + wIdx * 0.33 + seed * 0.2) % 1.0;
      const waveAlpha = Math.sin(wavePhase * Math.PI) * 0.72 * fadeOut;
      const baseX = (wIdx - 1) * 13 * scale;
      const startY = -12 * scale - wavePhase * 28 * scale;
      const waveH = 22 * scale;

      ctx.strokeStyle = wIdx % 2 === 0
        ? `rgba(163, 230, 53, ${waveAlpha.toFixed(3)})`
        : `rgba(250, 204, 21, ${waveAlpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(1.8, 3.0 * scale);
      ctx.beginPath();
      for (let step = 0; step <= 6; step++) {
        const frac = step / 6;
        const wy = startY - frac * waveH;
        const wx = baseX + Math.sin(frac * Math.PI * 2 + t * 6.5 + wIdx) * (5.5 * scale);
        if (step === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }

    // 3. Moscas animadas (🪰) describiendo órbitas en 8 (Lissajous) con alitas batiendo a toda velocidad
    const numFlies = 3 + (seed % 2);
    for (let f = 0; f < numFlies; f++) {
      const flySpeed = 4.2 + f * 0.85;
      const ang = t * flySpeed + f * 2.1 + seed;
      const orbitRx = (20 + f * 6) * scale;
      const orbitRy = (11 + f * 3.5) * scale;
      const fx = Math.cos(ang) * orbitRx;
      const fy = -22 * scale + Math.sin(ang * 2.0) * orbitRy;
      const vxDir = -Math.sin(ang) >= 0 ? 1 : -1;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(vxDir * 0.18 + Math.cos(ang * 2.0) * 0.25);

      // Alitas blancas translúcidas batiendo a 45 Hz
      const wingFlap = Math.sin(t * 55.0 + f * 1.7) * 3.2 * scale;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.82)';
      ctx.beginPath();
      ctx.ellipse(-2.2 * scale, (-3.2 - Math.abs(wingFlap)) * scale, 3.6 * scale, 2.0 * scale, -0.45, 0, Math.PI * 2);
      ctx.ellipse(2.2 * scale, (-3.2 - Math.abs(wingFlap)) * scale, 3.6 * scale, 2.0 * scale, 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Cuerpo negro-azulado de la mosca
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.8 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Reflejo verde metálico en el tórax y ojitos rojos diminutos
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(-0.6 * vxDir * scale, -0.4 * scale, 1.4 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(2.4 * vxDir * scale, -0.5 * scale, 1.1 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  renderAnnoyingDogModeOverlay(ctx, currentTime) {
    if (!this._dogAssetsReady) {
      this.initAnnoyingDogModeAssets();
      this._prepareAnnoyingDogChoreography();
    } else if (this.notes && this.notes.length > 0 && (!this._dogSteaks || this._dogSteaks.length === 0)) {
      this._prepareAnnoyingDogChoreography();
    }

    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._dogLastOverlayNow || nowPerf)) / 1000));
    this._dogLastOverlayNow = nowPerf;

    const scrollDur = (Number.isFinite(this.scrollDurationMs) && this.scrollDurationMs > 0) ? this.scrollDurationMs : 1450;
    const invScrollDur = 1.0 / scrollDur;
    const w = this.width || 360;
    const h = this.height || 640;
    const st = this._dogState;

    ctx.save();

    // 1. Dibujar y actualizar las huellas doradas (🐾) sobre la pista
    if (this._dogPawPrints && this._dogPawPrints.length > 0) {
      for (let i = this._dogPawPrints.length - 1; i >= 0; i--) {
        const fp = this._dogPawPrints[i];
        fp.age += dt;
        if (fp.age >= fp.duration) {
          this._dogPawPrints[i] = this._dogPawPrints[this._dogPawPrints.length - 1];
          this._dogPawPrints.pop();
          continue;
        }
        const pCoord = this.getPerspectiveCoord(fp.lane, fp.p, this._coordScratch1);
        const alpha = Math.max(0, (1 - fp.age / fp.duration) * 0.55);
        const sz = Math.max(12, 24 * pCoord.scale);
        ctx.globalAlpha = alpha;
        if (this._dogPawPrintSprite) {
          ctx.drawImage(this._dogPawPrintSprite, pCoord.x - sz * 0.5, pCoord.y - sz * 0.5, sz, sz);
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 2. Dibujar y actualizar el rastro de Cacas Olorosas con Moscas (💩 + 🪰) sobre la pista
    if (this._dogPoops && this._dogPoops.length > 0) {
      for (let i = this._dogPoops.length - 1; i >= 0; i--) {
        const poop = this._dogPoops[i];
        poop.age += dt;
        // Las cacas se deslizan suavemente por la pista mientras humean y las moscas revolotean
        poop.p += dt * 0.045;
        if (poop.age >= poop.duration || poop.p > 1.08) {
          this._dogPoops[i] = this._dogPoops[this._dogPoops.length - 1];
          this._dogPoops.pop();
          continue;
        }
        const poopCoord = this.getPerspectiveCoord(poop.lane, poop.p, this._coordScratch1);
        this._drawSmellyPoopWithFlies(ctx, poopCoord.x, poopCoord.y, poopCoord.scale, poop.age, poop.duration, currentTime, poop.seed);
      }
      ctx.globalAlpha = 1.0;
    }

    // 3. Buscar teclas que el perro va a golpear con el zarpazo y renderizar los Chuletones T-Bone Gigantes
    let activeTargetSteak = null;
    let activeBattedNote = null;

    if (this.notes && this.notes.length > 0) {
      const startIdx = Math.max(0, this.firstActiveNoteIndex || 0);
      for (let i = startIdx; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (!n || n.hit || n.missed || !n._dogBatted) continue;
        const timeUntil = (n.timestamp_ms ?? 0) - currentTime;
        if (timeUntil > scrollDur * 1.1) break;
        const pN = 1.0 - timeUntil * invScrollDur;
        if (pN >= 0.12 && pN <= (n._dogSwipeP + 0.10)) {
          activeBattedNote = { note: n, p: pN };
          break;
        }
      }
    }

    if (this._dogSteaks && this._dogSteaks.length > 0) {
      for (let i = 0; i < this._dogSteaks.length; i++) {
        const stk = this._dogSteaks[i];
        if (!stk || stk.eaten || stk.beingEaten) continue;
        const timeUntil = stk.hitTimeMs - currentTime;
        if (timeUntil > scrollDur * 1.15) break;
        const pSteak = 1.0 - timeUntil * invScrollDur;
        if (pSteak > 1.06) {
          stk.eaten = true;
          continue;
        }
        if (pSteak < -0.08) continue;

        if (!activeTargetSteak && st.zoomiesTimer <= 0 && st.eatTimer <= 0 && pSteak >= 0.05 && pSteak <= stk.eatP + 0.12) {
          activeTargetSteak = { steak: stk, p: pSteak };
        }

        const sCoord = this.getPerspectiveCoord(stk.lane, pSteak, this._coordScratch0);
        // ¡Gran Entrecot detallado mucho más grande, jugoso y reconocible!
        const pulse = 1.0 + Math.sin(currentTime * 0.012 + i) * 0.06;
        const sW = Math.min(sCoord.laneW * 1.08, 138 * sCoord.scale) * pulse;
        const sH = sW * 0.80;
        const sBob = Math.sin(currentTime * 0.010 + i) * (3.5 * sCoord.scale);

        // Anillo dorado brillante en la pista indicando el objetivo del perrito
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
        ctx.lineWidth = Math.max(1.5, 2.5 * sCoord.scale);
        ctx.beginPath();
        ctx.ellipse(sCoord.x, sCoord.y + sH * 0.22, sW * 0.46, sH * 0.24, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (this._dogSteakSprite) {
          ctx.drawImage(this._dogSteakSprite, sCoord.x - sW * 0.5, sCoord.y - sH * 0.5 + sBob, sW, sH);
        }

        // Volutas de vapor caliente saliendo del chuletón recién hecho
        const steamAlpha = 0.45 + 0.25 * Math.sin(currentTime * 0.008 + i);
        ctx.strokeStyle = `rgba(255, 255, 255, ${steamAlpha.toFixed(2)})`;
        ctx.lineWidth = Math.max(1.4, 2.2 * sCoord.scale);
        for (let sm = -1; sm <= 1; sm += 2) {
          const sx = sCoord.x + sm * 14 * sCoord.scale;
          const sy = sCoord.y - sH * 0.35 + sBob;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(sx + sm * 6 * sCoord.scale, sy - 10 * sCoord.scale, sx - sm * 3 * sCoord.scale, sy - 20 * sCoord.scale);
          ctx.stroke();
        }

        // Cuando el Pomeranian alcanza el chuletón (y no está ya en medio de las zoomies), ¡lo agarra con la boca y empieza a devorarlo en 3 bocados!
        if (st.zoomiesTimer <= 0 && st.eatTimer <= 0 && pSteak >= stk.eatP - 0.03 && Math.abs(st.lane - stk.lane) < 0.65) {
          stk.beingEaten = true;
          st.eatingSteak = stk;
          st.eatTotalDur = 0.72;
          st.eatTimer = st.eatTotalDur;
          st.lastBiteStage = -1;
          st.lane = stk.lane;
          st.p = Math.min(0.68, Math.max(0.38, pSteak));
        }
      }
    }

    // 4. Lógica de Masticación en 3 Bocados, Engorde de Barriga (0..10) y Frenesí de Cacas Olorosas
    if (st.bellyBounceTimer > 0) {
      st.bellyBounceTimer = Math.max(0, st.bellyBounceTimer - dt);
    }

    if (st.eatTimer > 0) {
      st.eatTimer = Math.max(0, st.eatTimer - dt);
      const eatProg = 1.0 - (st.eatTimer / (st.eatTotalDur || 0.72));
      const biteStage = eatProg < 0.36 ? 0 : (eatProg < 0.72 ? 1 : 2);

      // En cada uno de los 3 bocados, lanzar partículas jugosas de carne, huesitos y sonido visual
      if (biteStage !== st.lastBiteStage) {
        st.lastBiteStage = biteStage;
        const eCoord = this.getPerspectiveCoord(st.lane, st.p, this._coordScratch1);
        const biteTexts = ['🥩 ¡ÑAM!', '🍖 ¡CHOMP!', '😋 ¡GLUP!'];
        st.barkText = biteTexts[biteStage] || '🥩 ¡ÑAM!';
        st.barkTimer = 0.55;

        for (let k = 0; k < 5; k++) {
          const ang = (k / 5) * Math.PI * 2 + biteStage;
          this._emitDogFxParticle(
            eCoord.x,
            eCoord.y - 8 * eCoord.scale,
            Math.cos(ang) * (50 + Math.random() * 40),
            -60 - Math.random() * 45 + Math.sin(ang) * 20,
            k % 2 === 0 ? 'heart' : 'crumb',
            k === 0 ? (biteStage === 2 ? '🦴' : '🥩') : (k === 2 ? '❤️' : ''),
            k % 2 === 0 ? '#ef4444' : '#fde047',
            (13 + Math.random() * 6) * eCoord.scale,
            0.62
          );
        }
      }

      // Al terminar el 3er bocado, ¡el chuletón pasa a la barriga y el perro engorda!
      if (st.eatTimer <= 0) {
        if (st.eatingSteak) {
          st.eatingSteak.eaten = true;
          st.eatingSteak.beingEaten = false;
          st.eatingSteak = null;
        }
        st.steaksEaten = Math.min(st.maxSteaksForFrenzy, (st.steaksEaten || 0) + 1);
        st.bellyBounceTimer = 0.45;

        if (st.steaksEaten >= st.maxSteaksForFrenzy) {
          // ¡COMIÓ LOS 10 CHULETONES! Está súper gordo y empieza a correr por toda la pantalla soltando cacas olorosas con moscas
          st.zoomiesTimer = st.zoomiesTotalDur;
          st.lastPoopMs = currentTime - 300;
          st.barkText = '💩 ¡EMPACHO! ¡CORRE QUE ME HAGO CACA! 🪰';
          st.barkTimer = 2.4;
          this._dogBannerText = '💩 ¡10/10 CHULETONES! ¡EL POMERANIAN ESTÁ ENORME Y SUELTA CACAS OLOROSAS! 🪰';
          this._dogBannerTimer = 3.2;
        } else if (st.steaksEaten >= 8) {
          st.barkText = `🎈 ¡QUÉ GORDO! (${st.steaksEaten}/10 🥩)`;
          st.barkTimer = 1.05;
        } else if (st.steaksEaten >= 5) {
          st.barkText = `🐶 ¡BARRIGA LLENA! (${st.steaksEaten}/10 🥩)`;
          st.barkTimer = 0.95;
        } else {
          st.barkText = `🥩 ¡QUÉ RICO! (${st.steaksEaten}/10)`;
          st.barkTimer = 0.85;
        }
      }
    }

    // 5. Máquina de estados de movimiento (Frenesí de Cacas vs Masticando vs Zarpazo vs Perseguir Chuletón vs Sentarse)
    let targetLane = st.lane;
    let targetP = st.p;
    let desiredPose = 'sitting';

    if (st.zoomiesTimer > 0) {
      // MODO FRENESÍ (ZOOMIES): Corre como loco en zig-zag y ocho por toda la pantalla soltando un rastro de cacas olorosas
      st.zoomiesTimer = Math.max(0, st.zoomiesTimer - dt);
      desiredPose = 'zoomies';
      const zElapsed = st.zoomiesTotalDur - st.zoomiesTimer;
      targetLane = 1.0 + Math.sin(zElapsed * 6.2) * 1.08;
      targetP = 0.50 + Math.cos(zElapsed * 4.3) * 0.22;

      // Soltar una caca olorosa con moscas cada ~540ms mientras corre por toda la pista
      if (currentTime - (st.lastPoopMs || 0) >= 540) {
        st.lastPoopMs = currentTime;
        if (this._dogPoops.length < 12) {
          this._dogPoops.push({
            lane: Math.max(0.05, Math.min(1.95, st.lane + (Math.random() - 0.5) * 0.16)),
            p: Math.max(0.22, Math.min(0.78, st.p + 0.04)),
            age: 0,
            duration: 5.8,
            seed: Math.floor(Math.random() * 100)
          });
        }
        const pCoord = this.getPerspectiveCoord(st.lane, st.p, this._coordScratch1);
        this._emitDogFxParticle(
          pCoord.x,
          pCoord.y,
          (Math.random() - 0.5) * 60,
          -45 - Math.random() * 30,
          'text',
          '💨',
          '#a3e635',
          15 * pCoord.scale,
          0.55
        );
      }

      // Al terminar la carrera loca de las cacas, vuelve a su tamaño normal (0/10) y empieza a comer de nuevo
      if (st.zoomiesTimer <= 0) {
        st.steaksEaten = 0;
        st.bellyBounceTimer = 0.45;
        st.barkText = '✨ ¡UFFF, QUÉ ALIVIO! ¡A COMER MÁS! 🥩';
        st.barkTimer = 1.8;
      }
    } else if (st.eatTimer > 0) {
      desiredPose = 'eating';
      targetLane = st.lane;
      targetP = st.p;
    } else if (activeBattedNote) {
      const n = activeBattedNote.note;
      const pN = activeBattedNote.p;
      const swipeP = n._dogSwipeP || 0.40;
      const fromL = n._dogFromLane ?? n.lane;
      const toL = n.lane ?? 1;

      if (pN < swipeP - 0.02) {
        targetLane = fromL;
        targetP = Math.max(0.30, swipeP - 0.02);
        desiredPose = 'chasing';
      } else {
        targetLane = fromL + (toL - fromL) * 0.45;
        targetP = pN;
        desiredPose = 'swiping';
        st.swipeTimer = 0.36;
        if (!n._dogSwipeTriggered) {
          n._dogSwipeTriggered = true;
          st.barkText = '🐾 ¡ZAS!';
          st.barkTimer = 0.85;
          const bCoord = this.getPerspectiveCoord(fromL, pN, this._coordScratch1);
          for (let k = 0; k < 5; k++) {
            this._emitDogFxParticle(
              bCoord.x,
              bCoord.y,
              (toL - fromL) * (65 + k * 18),
              -35 - Math.random() * 30,
              'crumb',
              '',
              '#fde047',
              9 * bCoord.scale,
              0.45
            );
          }
        }
      }
    } else if (activeTargetSteak) {
      targetLane = activeTargetSteak.steak.lane;
      // El perro acompaña y persigue al chuletón mientras baja para molestar más tiempo en pantalla
      targetP = Math.max(0.34, Math.min(activeTargetSteak.steak.eatP, activeTargetSteak.p + 0.06));
      desiredPose = 'chasing';
    } else {
      let sitTarget = null;
      if (this._dogSitSchedule) {
        for (let i = 0; i < this._dogSitSchedule.length; i++) {
          const s = this._dogSitSchedule[i];
          if (currentTime >= s.startMs && currentTime <= s.endMs) {
            sitTarget = s;
            break;
          }
        }
      }
      if (sitTarget) {
        targetLane = sitTarget.lane;
        targetP = sitTarget.p;
        desiredPose = 'sitting';
      } else {
        targetLane = 1.0 + Math.sin(currentTime * 0.0012) * 0.94;
        targetP = 0.54 + Math.cos(currentTime * 0.0009) * 0.08;
        desiredPose = 'sitting';
      }
    }

    const dLane = targetLane - st.lane;
    const dP = targetP - st.p;
    const followSpeed = desiredPose === 'zoomies'
      ? 11.5
      : ((desiredPose === 'swiping' || desiredPose === 'chasing') ? 7.8 : 4.2);
    st.lane += dLane * Math.min(1, dt * followSpeed);
    st.p += dP * Math.min(1, dt * followSpeed);

    if (Math.abs(dLane) > 0.03) {
      st.facingDir = dLane > 0 ? 1 : -1;
    }

    if (st.zoomiesTimer > 0) {
      st.pose = 'zoomies';
    } else if (st.eatTimer > 0) {
      st.pose = 'eating';
    } else if (st.swipeTimer > 0) {
      st.swipeTimer = Math.max(0, st.swipeTimer - dt);
      st.pose = 'swiping';
    } else if (Math.abs(dLane) > 0.14 || Math.abs(dP) > 0.06) {
      st.pose = 'chasing';
    } else {
      st.pose = 'sitting';
    }

    // Emitir huellas de patitas al caminar/correr
    if ((st.pose === 'chasing' || st.pose === 'zoomies') && (currentTime - (st.lastStepMs || 0) > (st.pose === 'zoomies' ? 75 : 130))) {
      st.lastStepMs = currentTime;
      if (this._dogPawPrints.length < 22) {
        this._dogPawPrints.push({
          lane: st.lane + (Math.random() - 0.5) * 0.14,
          p: st.p + 0.03,
          age: 0,
          duration: 1.15
        });
      }
    }

    // 6. Calcular el nivel de gordura visual (durante las zoomies se va desinflando conforme suelta las cacas)
    const effectiveChubby = st.zoomiesTimer > 0
      ? (st.maxSteaksForFrenzy * (st.zoomiesTimer / st.zoomiesTotalDur))
      : (st.steaksEaten || 0);

    // 7. Dibujar al Pomeranian en la coordenada 3D de la pista
    const dogCoord = this.getPerspectiveCoord(st.lane, st.p, this._coordScratch0);
    // Además de ensanchar la barriga, su escala general crece hasta un +58% al comer 10 chuletones, ocupando gran parte de la pantalla
    const fatScaleBoost = 1.0 + (effectiveChubby / 10) * 0.58;
    const dogScale = dogCoord.scale * (st.pose === 'sitting' ? 1.48 : 1.38) * fatScaleBoost;
    const swipeProg = st.swipeTimer > 0 ? (1.0 - st.swipeTimer / 0.36) : 0;
    const eatProg = st.eatTimer > 0 ? (1.0 - st.eatTimer / (st.eatTotalDur || 0.72)) : 0;

    this._drawPomeranianDog(
      ctx,
      dogCoord.x,
      dogCoord.y,
      dogScale,
      st.pose,
      st.facingDir,
      currentTime,
      swipeProg,
      effectiveChubby,
      eatProg,
      st.bellyBounceTimer || 0
    );

    // Bocadillo expresivo sobre el perrito
    if (st.barkTimer > 0 && st.barkText) {
      st.barkTimer = Math.max(0, st.barkTimer - dt);
      const bAlpha = Math.min(1, st.barkTimer * 2.2);
      ctx.save();
      ctx.globalAlpha = bAlpha;
      const bx = Math.max(85, Math.min(w - 85, dogCoord.x));
      const by = Math.max(76, dogCoord.y - (52 + effectiveChubby * 2.2) * dogScale);
      ctx.font = `900 ${Math.max(11, Math.min(16, Math.round(12.5 * dogScale)))}px "Outfit", system-ui, sans-serif`;
      const tw = ctx.measureText(st.barkText).width + 18;
      const th = 24 * Math.max(0.85, Math.min(1.25, dogScale));

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = st.zoomiesTimer > 0 ? '#a3e635' : '#fbbf24';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx - tw * 0.5, by - th * 0.5, tw, th, 11);
      else ctx.rect(bx - tw * 0.5, by - th * 0.5, tw, th);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = st.zoomiesTimer > 0 ? '#ecfccb' : '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.barkText, bx, by);
      ctx.restore();
    }

    // 8. Partículas de corazones, bocados de chuletón y zarpazos
    if (this._dogFxParticles && this._dogFxParticles.length > 0) {
      let fLen = this._dogFxParticles.length;
      for (let i = fLen - 1; i >= 0; i--) {
        const pt = this._dogFxParticles[i];
        pt.age += dt;
        if (pt.age >= pt.duration) {
          this._dogFxParticles[i] = this._dogFxParticles[fLen - 1];
          this._dogFxParticles.pop();
          fLen--;
          if (this._dogFxFreePool.length < 80) this._dogFxFreePool.push(pt);
          continue;
        }
        const p = pt.age / pt.duration;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        ctx.globalAlpha = Math.max(0, 1 - p);
        if (pt.text) {
          ctx.font = `900 ${Math.round(pt.size)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(2, pt.size * 0.35 * (1 - p * 0.5)), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 9. Medidor HUD elegante de "Barriga del Pomeranian (🥩 X / 10)" en la parte superior de la pista
    {
      const hudW = Math.min(w - 28, 258);
      const hudH = 30;
      const hudX = w * 0.5 - hudW * 0.5;
      const hudY = Math.max(54, h * 0.115);

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
      ctx.strokeStyle = st.zoomiesTimer > 0 ? '#a3e635' : 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(hudX, hudY, hudW, hudH, 15);
      else ctx.rect(hudX, hudY, hudW, hudH);
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 10.5px "Outfit", system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = st.zoomiesTimer > 0 ? '#bef264' : '#fde68a';
      const labelTxt = st.zoomiesTimer > 0
        ? '💩 ¡EMPACHO EN CURSO!'
        : `🐶 BARRIGA: 🥩 ${st.steaksEaten || 0}/10`;
      ctx.fillText(labelTxt, hudX + 11, hudY + hudH * 0.5);

      // 10 segmentos visuales de chuletón / barriga a la derecha del pill
      const segStartX = hudX + 136;
      const segTotalW = hudW - 146;
      const segGap = 2.5;
      const segW = (segTotalW - segGap * 9) / 10;
      const segH = 10;
      const segY = hudY + (hudH - segH) * 0.5;
      const filledCount = st.zoomiesTimer > 0 ? Math.ceil(effectiveChubby) : (st.steaksEaten || 0);

      for (let s = 0; s < 10; s++) {
        const sx = segStartX + s * (segW + segGap);
        if (s < filledCount) {
          ctx.fillStyle = st.zoomiesTimer > 0
            ? '#84cc16'
            : (s >= 7 ? '#ef4444' : (s >= 4 ? '#f97316' : '#fbbf24'));
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        }
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(sx, segY, segW, segH, 3);
        else ctx.rect(sx, segY, segW, segH);
        ctx.fill();
      }
      ctx.restore();
    }

    // 10. Cartel luminoso de apertura o de alerta de Empacho
    if (this._dogBannerTimer > 0 && this._dogBannerText) {
      this._dogBannerTimer = Math.max(0, this._dogBannerTimer - dt);
      ctx.globalAlpha = Math.min(1, this._dogBannerTimer * 1.5);
      const bannerY = h * 0.22;
      const bw = Math.min(w - 14, 356);
      const bh = 34;

      ctx.fillStyle = 'rgba(24, 13, 6, 0.94)';
      ctx.strokeStyle = st.zoomiesTimer > 0 ? '#a3e635' : '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh, 12);
      else ctx.rect(w * 0.5 - bw * 0.5, bannerY - bh * 0.5, bw, bh);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 10px "Outfit", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = st.zoomiesTimer > 0 ? '#bef264' : '#fde047';
      ctx.fillText(this._dogBannerText, w * 0.5, bannerY);
    }

    ctx.restore();
  }

  // =========================================================================
  // MODO RÍO RÁPIDO (ROCAS FLOTANTES CON HONDURAS LUMINOSAS, TRONCOS HOLD Y CORRIENTE DINÁMICA POR DENSIDAD)
  // =========================================================================

  initRiverModeAssets() {
    if (this._riverAssetsReady && this._riverLilyPadSprite && this._riverKoiSprites && this._riverSealSprites && this._riverSealBustSprites) return;
    this._riverAssetsReady = true;
    this._riverSplashes = [];
    this._riverSplashPool = [];
    this._riverTapRipples = [];
    this._riverWaterCrowns = [];
    this._riverLeapingFish = [];
    this._riverLastLaneFlash = [0, 0, 0];

    // Peces Koi nadando bajo la superficie cristalina del río
    this._riverSwimmingKoi = [
      { lane: 0.35, p: 0.28, vx: 0.18, vp: 0.08, variant: 0, phase: 0.0 },
      { lane: 1.65, p: 0.52, vx: -0.22, vp: -0.06, variant: 1, phase: 2.1 },
      { lane: 0.95, p: 0.74, vx: 0.15, vp: 0.09, variant: 0, phase: 4.2 }
    ];

    // Focas Moteadas Ultra Realistas nadando y serpenteando por la corriente del río
    this._riverSwimmingSeals = [
      { lane: 0.42, p: 0.40, vx: 0.14, vp: 0.065, variant: 0, phase: 0.5, diveCycle: 0.0 },
      { lane: 1.58, p: 0.68, vx: -0.15, vp: -0.055, variant: 1, phase: 3.1, diveCycle: 2.2 },
      { lane: 1.02, p: 0.22, vx: 0.12, vp: 0.075, variant: 0, phase: 1.8, diveCycle: 4.5 }
    ];

    // Focas Ultra Realistas asomando la cabeza y descansando junto a las rocas de las orillas
    this._riverBankSeals = [
      { side: 0, p: 0.34, variant: 0, phase: 0.0, lookAng: 0.18 },
      { side: 1, p: 0.56, variant: 1, phase: 1.9, lookAng: -0.22 },
      { side: 0, p: 0.78, variant: 1, phase: 3.7, lookAng: 0.15 },
      { side: 1, p: 0.24, variant: 0, phase: 5.1, lookAng: -0.16 }
    ];

    // Nenúfares esmeralda con flor de loto flotando junto a las orillas
    this._riverLilyPads = [
      { side: 0, p: 0.20, rot: 0.2, hasLotus: true },
      { side: 1, p: 0.44, rot: 1.5, hasLotus: false },
      { side: 0, p: 0.68, rot: 2.8, hasLotus: true },
      { side: 1, p: 0.85, rot: 4.1, hasLotus: true }
    ];

    if (typeof document === 'undefined') return;

    // 1. Sprite de Nenúfar Esmeralda con Flor de Loto Rosa/Blanca (🪷)
    const lilyCvs = document.createElement('canvas');
    lilyCvs.width = 88;
    lilyCvs.height = 88;
    const lc = lilyCvs.getContext('2d');
    const lcx = 44, lcy = 44;

    lc.fillStyle = 'rgba(2, 44, 34, 0.38)';
    lc.beginPath();
    lc.arc(lcx, lcy + 4, 32, 0.25, Math.PI * 2 - 0.25);
    lc.lineTo(lcx, lcy + 4);
    lc.closePath();
    lc.fill();

    const padGrad = lc.createRadialGradient(lcx - 6, lcy - 6, 4, lcx, lcy, 32);
    padGrad.addColorStop(0.0, '#4ade80');
    padGrad.addColorStop(0.65, '#16a34a');
    padGrad.addColorStop(1.0, '#14532d');
    lc.fillStyle = padGrad;
    lc.strokeStyle = '#bbf7d0';
    lc.lineWidth = 1.8;
    lc.beginPath();
    lc.arc(lcx, lcy, 31, 0.28, Math.PI * 2 - 0.28);
    lc.lineTo(lcx, lcy);
    lc.closePath();
    lc.fill();
    lc.stroke();

    // Nervaduras radiales de la hoja de nenúfar
    lc.strokeStyle = 'rgba(187, 247, 208, 0.35)';
    lc.lineWidth = 1.3;
    for (let a = 0.7; a < Math.PI * 2 - 0.6; a += 0.65) {
      lc.beginPath();
      lc.moveTo(lcx, lcy);
      lc.lineTo(lcx + Math.cos(a) * 26, lcy + Math.sin(a) * 26);
      lc.stroke();
    }

    // Flor de loto central
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2;
      lc.save();
      lc.translate(lcx, lcy);
      lc.rotate(ang);
      lc.fillStyle = (p % 2 === 0) ? '#f472b6' : '#fbcfe8';
      lc.beginPath();
      lc.ellipse(10, 0, 9, 4.5, 0, 0, Math.PI * 2);
      lc.fill();
      lc.restore();
    }
    lc.fillStyle = '#fde047';
    lc.beginPath();
    lc.arc(lcx, lcy, 5.2, 0, Math.PI * 2);
    lc.fill();

    this._riverLilyPadSprite = lilyCvs;

    // 2. Dos Sprites de Peces Koi (Dorado Imperial y Calicó Blanco-Rojo)
    this._riverKoiSprites = [];
    const koiPalettes = [
      { body: '#f97316', spot: '#fde047', fin: '#fffbeb' },
      { body: '#f8fafc', spot: '#ef4444', fin: '#fed7aa' }
    ];
    for (let k = 0; k < koiPalettes.length; k++) {
      const kp = koiPalettes[k];
      const kCvs = document.createElement('canvas');
      kCvs.width = 84;
      kCvs.height = 56;
      const kc = kCvs.getContext('2d');
      kc.translate(42, 28);

      kc.fillStyle = kp.fin;
      kc.beginPath();
      kc.ellipse(4, -13, 9, 4.5, -0.5, 0, Math.PI * 2);
      kc.ellipse(4, 13, 9, 4.5, 0.5, 0, Math.PI * 2);
      kc.fill();

      kc.beginPath();
      kc.moveTo(-14, 0);
      kc.quadraticCurveTo(-28, -12, -36, -9);
      kc.quadraticCurveTo(-26, 0, -36, 9);
      kc.quadraticCurveTo(-28, 12, -14, 0);
      kc.closePath();
      kc.fill();

      kc.fillStyle = kp.body;
      kc.beginPath();
      kc.ellipse(2, 0, 22, 10.5, 0, 0, Math.PI * 2);
      kc.fill();

      kc.fillStyle = kp.spot;
      kc.beginPath();
      kc.arc(8, -2, 6.5, 0, Math.PI * 2);
      kc.arc(-5, 3, 5.2, 0, Math.PI * 2);
      kc.fill();

      kc.fillStyle = '#0f172a';
      kc.beginPath();
      kc.arc(18, -4.5, 1.8, 0, Math.PI * 2);
      kc.arc(18, 4.5, 1.8, 0, Math.PI * 2);
      kc.fill();

      this._riverKoiSprites.push(kCvs);
    }

    // 3. FOCAS ULTRA REALISTAS NADANDO (2 variantes de pelaje húmedo: Gris Plateado Moteado y Pardo Pizarra Ártico)
    this._riverSealSprites = [];
    const sealCoats = [
      {
        deep: '#1e293b',
        mid: '#475569',
        light: '#94a3b8',
        belly: '#cbd5e1',
        wetSheen: 'rgba(241, 245, 249, 0.68)',
        spotDark: 'rgba(15, 23, 42, 0.65)',
        spotRing: 'rgba(226, 232, 240, 0.42)',
        flipper: '#334155'
      },
      {
        deep: '#292524',
        mid: '#57534e',
        light: '#a8a29e',
        belly: '#d6d3d1',
        wetSheen: 'rgba(250, 250, 249, 0.64)',
        spotDark: 'rgba(28, 25, 23, 0.68)',
        spotRing: 'rgba(231, 229, 228, 0.40)',
        flipper: '#44403c'
      }
    ];

    const sealSpots = [
      { x: -24, y: -6, rx: 4.2, ry: 2.8, a: 0.2, ring: true },
      { x: -16, y: 5, rx: 3.5, ry: 2.4, a: -0.3, ring: false },
      { x: -10, y: -9, rx: 4.8, ry: 3.1, a: 0.1, ring: true },
      { x: -4, y: 1, rx: 3.2, ry: 2.2, a: 0.4, ring: false },
      { x: 2, y: 9, rx: 4.4, ry: 2.7, a: -0.2, ring: true },
      { x: 8, y: -7, rx: 3.8, ry: 2.5, a: 0.3, ring: false },
      { x: 14, y: 4, rx: 3.0, ry: 2.1, a: -0.1, ring: true },
      { x: -29, y: 3, rx: 3.1, ry: 2.0, a: 0.2, ring: false },
      { x: -19, y: -2, rx: 2.6, ry: 1.8, a: 0, ring: false },
      { x: 5, y: -1, rx: 2.8, ry: 1.9, a: 0.2, ring: false },
      { x: 18, y: -4, rx: 2.5, ry: 1.7, a: -0.2, ring: false },
      { x: -8, y: 10, rx: 3.3, ry: 2.1, a: 0.1, ring: false }
    ];

    for (let sIdx = 0; sIdx < sealCoats.length; sIdx++) {
      const sc = sealCoats[sIdx];
      const sCvs = document.createElement('canvas');
      sCvs.width = 164;
      sCvs.height = 108;
      const ctxS = sCvs.getContext('2d');
      ctxS.translate(82, 54);

      // Sombra submarina suave bajo la foca
      ctxS.fillStyle = 'rgba(2, 18, 34, 0.38)';
      ctxS.beginPath();
      ctxS.ellipse(0, 6, 52, 22, 0, 0, Math.PI * 2);
      ctxS.fill();

      // Aletas traseras gemelas palmeadas (Hind Flippers) con estrías anatómicas
      ctxS.fillStyle = sc.flipper;
      ctxS.strokeStyle = sc.deep;
      ctxS.lineWidth = 1.4;
      for (let hf = -1; hf <= 1; hf += 2) {
        ctxS.beginPath();
        ctxS.moveTo(-36, hf * 3);
        ctxS.quadraticCurveTo(-54, hf * 15, -66, hf * 12);
        ctxS.quadraticCurveTo(-60, hf * 5, -64, hf * 2);
        ctxS.quadraticCurveTo(-50, hf * 1, -36, hf * 1);
        ctxS.closePath();
        ctxS.fill();
        ctxS.stroke();
      }

      // Aletas pectorales delanteras (Fore Flippers) con 5 dígitos palmeados
      for (let ff = -1; ff <= 1; ff += 2) {
        ctxS.save();
        ctxS.translate(10, ff * 16);
        ctxS.rotate(ff * 0.48);
        const fGrad = ctxS.createLinearGradient(0, 0, -14, ff * 24);
        fGrad.addColorStop(0, sc.mid);
        fGrad.addColorStop(1, sc.deep);
        ctxS.fillStyle = fGrad;
        ctxS.beginPath();
        ctxS.moveTo(8, 0);
        ctxS.quadraticCurveTo(4, ff * 22, -10, ff * 26);
        ctxS.quadraticCurveTo(-18, ff * 20, -14, ff * 10);
        ctxS.quadraticCurveTo(-6, ff * 2, 8, 0);
        ctxS.closePath();
        ctxS.fill();
        ctxS.stroke();
        ctxS.restore();
      }

      // Cuerpo hidrodinámico fusiforme 3D de la foca con degradado de pelaje mojado
      const bodyGrad = ctxS.createRadialGradient(4, -5, 4, -2, 0, 48);
      bodyGrad.addColorStop(0.00, sc.light);
      bodyGrad.addColorStop(0.45, sc.mid);
      bodyGrad.addColorStop(0.85, sc.deep);
      bodyGrad.addColorStop(1.00, '#0f172a');
      ctxS.fillStyle = bodyGrad;
      ctxS.beginPath();
      ctxS.moveTo(32, 0);
      ctxS.bezierCurveTo(32, -18, 4, -22, -22, -14);
      ctxS.bezierCurveTo(-36, -9, -44, -4, -44, 0);
      ctxS.bezierCurveTo(-44, 4, -36, 9, -22, 14);
      ctxS.bezierCurveTo(4, 22, 32, 18, 32, 0);
      ctxS.closePath();
      ctxS.fill();

      // Textura realista de manchas orgánicas de foca común (Phoca vitulina)
      for (let m = 0; m < sealSpots.length; m++) {
        const sp = sealSpots[m];
        if (sp.ring) {
          ctxS.strokeStyle = sc.spotRing;
          ctxS.lineWidth = 1.3;
          ctxS.beginPath();
          ctxS.ellipse(sp.x, sp.y, sp.rx + 1.4, sp.ry + 1.2, sp.a, 0, Math.PI * 2);
          ctxS.stroke();
        }
        ctxS.fillStyle = sc.spotDark;
        ctxS.beginPath();
        ctxS.ellipse(sp.x, sp.y, sp.rx, sp.ry, sp.a, 0, Math.PI * 2);
        ctxS.fill();
      }

      // Brillo especular de agua sobre el lomo mojado de la foca
      const sheenGrad = ctxS.createLinearGradient(-26, -6, 24, -2);
      sheenGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      sheenGrad.addColorStop(0.35, sc.wetSheen);
      sheenGrad.addColorStop(0.75, sc.wetSheen);
      sheenGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctxS.fillStyle = sheenGrad;
      ctxS.beginPath();
      ctxS.ellipse(-2, -4, 26, 6.5, -0.05, 0, Math.PI * 2);
      ctxS.fill();

      // Cabeza redondeada anatómica y hocico expresivo de foca
      const headGrad = ctxS.createRadialGradient(34, -3, 2, 32, 0, 19);
      headGrad.addColorStop(0.0, sc.belly);
      headGrad.addColorStop(0.55, sc.mid);
      headGrad.addColorStop(1.0, sc.deep);
      ctxS.fillStyle = headGrad;
      ctxS.beginPath();
      ctxS.ellipse(31, 0, 16.5, 13.5, 0, 0, Math.PI * 2);
      ctxS.fill();

      // Hocico abultado (almohadillas de los bigotes) y nariz húmeda en forma de V
      ctxS.fillStyle = sc.belly;
      ctxS.beginPath();
      ctxS.ellipse(44, -3.6, 5.5, 4.2, 0.2, 0, Math.PI * 2);
      ctxS.ellipse(44, 3.6, 5.5, 4.2, -0.2, 0, Math.PI * 2);
      ctxS.fill();

      // Nariz negra brillante húmeda con fosas nasales
      ctxS.fillStyle = '#090d16';
      ctxS.beginPath();
      ctxS.ellipse(47.5, 0, 3.2, 3.8, 0, 0, Math.PI * 2);
      ctxS.fill();
      ctxS.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctxS.beginPath();
      ctxS.arc(46.8, -1.1, 1.0, 0, Math.PI * 2);
      ctxS.fill();

      // Ojos grandes negros líquidos hiperrealistas con doble reflejo corneal
      for (let ey = -1; ey <= 1; ey += 2) {
        const eyeY = ey * 6.4;
        ctxS.fillStyle = '#020617';
        ctxS.beginPath();
        ctxS.ellipse(36.5, eyeY, 3.6, 3.1, ey * 0.15, 0, Math.PI * 2);
        ctxS.fill();
        // Reflejo principal de cielo/agua en la córnea
        ctxS.fillStyle = '#ffffff';
        ctxS.beginPath();
        ctxS.arc(37.6, eyeY - 1.0, 1.25, 0, Math.PI * 2);
        ctxS.fill();
        ctxS.fillStyle = '#bae6fd';
        ctxS.beginPath();
        ctxS.arc(35.3, eyeY + 1.0, 0.65, 0, Math.PI * 2);
        ctxS.fill();
      }

      // Vibrisas (Bigotes plateados translúcidos curvados hacia atrás)
      ctxS.strokeStyle = 'rgba(241, 245, 249, 0.85)';
      ctxS.lineWidth = 1.05;
      ctxS.beginPath();
      for (let side = -1; side <= 1; side += 2) {
        for (let w = 0; w < 4; w++) {
          const wy0 = side * (3.2 + w * 1.1);
          const wx0 = 44.5 - w * 0.8;
          ctxS.moveTo(wx0, wy0);
          ctxS.quadraticCurveTo(wx0 + 2, wy0 + side * (7 + w * 2.5), wx0 - 7 - w * 2, wy0 + side * (12 + w * 3.2));
        }
      }
      ctxS.stroke();

      this._riverSealSprites.push(sCvs);
    }

    // 4. FOCAS ULTRA REALISTAS ASOMANDO DEL AGUA (Spy-Hopping / Busto 3D con cabeza, ojos húmedos, bigotes y anillo de espuma)
    this._riverSealBustSprites = [];
    for (let bIdx = 0; bIdx < 2; bIdx++) {
      const sc = sealCoats[bIdx % sealCoats.length];
      const bCvs = document.createElement('canvas');
      bCvs.width = 132;
      bCvs.height = 132;
      const bc = bCvs.getContext('2d');
      const cx = 66, cy = 72;

      // Anillo de espuma blanca y onda turquesa en la superficie del agua rodeando a la foca
      bc.strokeStyle = 'rgba(125, 211, 252, 0.65)';
      bc.lineWidth = 3.0;
      bc.beginPath();
      bc.ellipse(cx, cy + 20, 48, 17, 0, 0, Math.PI * 2);
      bc.stroke();

      bc.fillStyle = 'rgba(224, 242, 254, 0.78)';
      bc.beginPath();
      bc.ellipse(cx, cy + 18, 41, 13, 0, 0, Math.PI * 2);
      bc.fill();

      // Hombros y cuello rechoncho húmedo emergiendo del agua
      const neckGrad = bc.createLinearGradient(cx - 28, cy - 10, cx + 28, cy + 22);
      neckGrad.addColorStop(0.0, sc.light);
      neckGrad.addColorStop(0.45, sc.mid);
      neckGrad.addColorStop(1.0, sc.deep);
      bc.fillStyle = neckGrad;
      bc.beginPath();
      bc.moveTo(cx - 32, cy + 18);
      bc.quadraticCurveTo(cx - 30, cy - 16, cx - 18, cy - 26);
      bc.lineTo(cx + 18, cy - 26);
      bc.quadraticCurveTo(cx + 30, cy - 16, cx + 32, cy + 18);
      bc.closePath();
      bc.fill();

      // Pecho claro moteado
      const chestGrad = bc.createRadialGradient(cx, cy + 6, 3, cx, cy + 8, 24);
      chestGrad.addColorStop(0.0, sc.belly);
      chestGrad.addColorStop(1.0, 'rgba(148, 163, 184, 0)');
      bc.fillStyle = chestGrad;
      bc.beginPath();
      bc.ellipse(cx, cy + 6, 22, 14, 0, 0, Math.PI * 2);
      bc.fill();

      // Motas realistas en hombros y pecho
      const bustSpots = [
        { x: -18, y: 4, r: 3.2 }, { x: -11, y: 12, r: 2.6 }, { x: 16, y: 5, r: 3.4 },
        { x: 11, y: 13, r: 2.4 }, { x: -6, y: 6, r: 2.1 }, { x: 7, y: 8, r: 2.3 }
      ];
      bc.fillStyle = sc.spotDark;
      for (let s = 0; s < bustSpots.length; s++) {
        bc.beginPath();
        bc.ellipse(cx + bustSpots[s].x, cy + bustSpots[s].y, bustSpots[s].r, bustSpots[s].r * 0.75, 0.2, 0, Math.PI * 2);
        bc.fill();
      }

      // Cabeza redondeada 3D de la foca
      const hGrad = bc.createRadialGradient(cx - 5, cy - 30, 4, cx, cy - 24, 26);
      hGrad.addColorStop(0.0, sc.belly);
      hGrad.addColorStop(0.5, sc.mid);
      hGrad.addColorStop(1.0, sc.deep);
      bc.fillStyle = hGrad;
      bc.beginPath();
      bc.ellipse(cx, cy - 24, 24, 21, 0, 0, Math.PI * 2);
      bc.fill();

      // Brillo de agua en la coronilla de la foca
      bc.fillStyle = sc.wetSheen;
      bc.beginPath();
      bc.ellipse(cx - 4, cy - 37, 13, 4.5, -0.12, 0, Math.PI * 2);
      bc.fill();

      // Ojos grandes redondos negros húmedos con doble brillo especular vivo
      for (let side = -1; side <= 1; side += 2) {
        const ex = cx + side * 10.5;
        const ey = cy - 27;
        // Cuenca suave
        bc.fillStyle = 'rgba(15, 23, 42, 0.35)';
        bc.beginPath();
        bc.arc(ex, ey, 6.6, 0, Math.PI * 2);
        bc.fill();
        // Globo ocular negro líquido
        bc.fillStyle = '#020617';
        bc.beginPath();
        bc.arc(ex, ey, 5.4, 0, Math.PI * 2);
        bc.fill();
        // Destello corneal principal
        bc.fillStyle = '#ffffff';
        bc.beginPath();
        bc.arc(ex - 1.6, ey - 1.8, 2.0, 0, Math.PI * 2);
        bc.fill();
        // Destello secundario turquesa del río
        bc.fillStyle = '#7dd3fc';
        bc.beginPath();
        bc.arc(ex + 1.8, ey + 1.8, 1.05, 0, Math.PI * 2);
        bc.fill();
      }

      // Hocico rechoncho (almohadillas de bigotes izquierda y derecha)
      bc.fillStyle = sc.belly;
      bc.beginPath();
      bc.ellipse(cx - 6.5, cy - 15, 8.5, 6.2, -0.15, 0, Math.PI * 2);
      bc.ellipse(cx + 6.5, cy - 15, 8.5, 6.2, 0.15, 0, Math.PI * 2);
      bc.fill();

      // Boca dulce curvada debajo del hocico
      bc.strokeStyle = '#1e293b';
      bc.lineWidth = 1.6;
      bc.beginPath();
      bc.moveTo(cx - 6, cy - 11);
      bc.quadraticCurveTo(cx, cy - 13.5, cx + 6, cy - 11);
      bc.stroke();

      // Nariz húmeda oscura en forma de corazón/V con fosas nasales y brillo
      bc.fillStyle = '#090d16';
      bc.beginPath();
      bc.moveTo(cx, cy - 14.5);
      bc.quadraticCurveTo(cx - 5.5, cy - 20.5, cx - 2.2, cy - 21);
      bc.quadraticCurveTo(cx, cy - 19.5, cx + 2.2, cy - 21);
      bc.quadraticCurveTo(cx + 5.5, cy - 20.5, cx, cy - 14.5);
      bc.closePath();
      bc.fill();
      bc.fillStyle = 'rgba(255, 255, 255, 0.8)';
      bc.beginPath();
      bc.ellipse(cx - 1.4, cy - 19.2, 1.6, 0.9, -0.2, 0, Math.PI * 2);
      bc.fill();

      // Puntos foliculares y abanico de bigotes plateados largos (Vibrisas realistas)
      bc.strokeStyle = 'rgba(248, 250, 252, 0.90)';
      bc.lineWidth = 1.15;
      bc.beginPath();
      for (let side = -1; side <= 1; side += 2) {
        for (let w = 0; w < 5; w++) {
          const sx = cx + side * (5.5 + (w % 2) * 3.0);
          const sy = cy - 17 + w * 1.4;
          const ctrlX = sx + side * (14 + w * 2.5);
          const ctrlY = sy - 2 + w * 1.2;
          const endX = sx + side * (24 + w * 3.2);
          const endY = sy + 5 + w * 2.4;
          bc.moveTo(sx, sy);
          bc.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        }
      }
      bc.stroke();

      // Collar de espuma blanca delantero lamiendo el pecho de la foca
      bc.fillStyle = '#ffffff';
      bc.beginPath();
      for (let f = -4; f <= 4; f++) {
        bc.arc(cx + f * 7.5, cy + 18 + Math.abs(f) * 0.6, 5.2 - Math.abs(f) * 0.4, 0, Math.PI * 2);
      }
      bc.fill();

      this._riverSealBustSprites.push(bCvs);
    }
  }

  // Pre-calcula el mapa de caudal acumulado F(t) según la densidad de notas de cada sección
  // Así los 3 carriles aceleran en los Rápidos (alta densidad) y se calman en Aguas Mansas (baja densidad) al unísono
  _prepareRiverChoreography() {
    const stepMs = 25;
    const minT = -3000;
    const maxT = Math.max(60000, (this.lastNoteTime || 60000) + 8000);
    const numSteps = Math.ceil((maxT - minT) / stepMs) + 1;

    this._riverFlowMinT = minT;
    this._riverFlowStepMs = stepMs;
    this._riverFlowPosTable = new Float64Array(numSteps);
    this._riverSpeedMultTable = new Float32Array(numSteps);
    const scratchSpeed = new Float32Array(numSteps);

    const notes = this.notes || [];
    const nLen = notes.length;

    let avgNotesPerSec = 3.0;
    if (nLen > 4) {
      const spanSec = Math.max(10, ((notes[nLen - 1].timestamp_ms || 30000) - (notes[0].timestamp_ms || 0)) / 1000);
      avgNotesPerSec = Math.max(1.4, Math.min(7.5, nLen / spanSec));
    }

    let noteCursor = 0;
    const winBefore = 1250;
    const winAfter = 1850;
    const winDurSec = (winBefore + winAfter) / 1000;

    for (let s = 0; s < numSteps; s++) {
      const t = minT + s * stepMs;
      while (noteCursor < nLen && (notes[noteCursor].timestamp_ms ?? 0) < t - winBefore) {
        noteCursor++;
      }

      let weightedCount = 0;
      for (let j = noteCursor; j < nLen; j++) {
        const nt = notes[j].timestamp_ms ?? 0;
        if (nt > t + winAfter) break;
        const rel = (nt - (t - winBefore)) / (winBefore + winAfter);
        const w = 0.5 - 0.5 * Math.cos(rel * Math.PI * 2);
        weightedCount += (notes[j].type === 'hold' ? 1.35 : 1.0) * (0.45 + 0.55 * w);
      }

      const localDensity = weightedCount / winDurSec;
      const densityRatio = localDensity / avgNotesPerSec;

      const riverSwell = Math.sin(t * 0.00095) * 0.09 + Math.cos(t * 0.0021) * 0.05;
      let speedMult = 0.70 + Math.min(0.88, Math.pow(Math.max(0, densityRatio), 1.08) * 0.42) + riverSwell;
      speedMult = Math.max(0.72, Math.min(1.62, speedMult));

      this._riverSpeedMultTable[s] = speedMult;
    }

    // Triple pasada de suavizado tipo Gaussiano (ventana efectiva ±600ms) para eliminar cualquier tirón de aceleración
    const radius = 8;
    for (let pass = 0; pass < 3; pass++) {
      const src = (pass % 2 === 0) ? this._riverSpeedMultTable : scratchSpeed;
      const dst = (pass % 2 === 0) ? scratchSpeed : this._riverSpeedMultTable;
      let runningSum = 0;
      let count = 0;
      for (let i = 0; i <= Math.min(numSteps - 1, radius); i++) {
        runningSum += src[i];
        count++;
      }
      for (let s = 0; s < numSteps; s++) {
        dst[s] = runningSum / count;
        const removeIdx = s - radius;
        const addIdx = s + radius + 1;
        if (removeIdx >= 0) {
          runningSum -= src[removeIdx];
          count--;
        }
        if (addIdx < numSteps) {
          runningSum += src[addIdx];
          count++;
        }
      }
    }

    // Integración trapezoidal C2-continua para la posición acumulada del caudal
    let smoothCum = 0.0;
    this._riverFlowPosTable[0] = 0.0;
    for (let s = 1; s < numSteps; s++) {
      const v0 = this._riverSpeedMultTable[s - 1];
      const v1 = this._riverSpeedMultTable[s];
      smoothCum += 0.5 * (v0 + v1) * stepMs;
      this._riverFlowPosTable[s] = smoothCum;
    }

    // Pre-cachear la posición de caudal exacta de cada nota para evitar búsquedas por nota en cada frame
    for (let i = 0; i < nLen; i++) {
      const n = notes[i];
      if (!n) continue;
      const nt = n.timestamp_ms ?? n.timeMs ?? 0;
      n._riverFlowPos = this._getRiverFlowPos(nt);
      if (n.type === 'hold') {
        const rawDur = Number.isFinite(n.duration_ms)
          ? n.duration_ms
          : (Number.isFinite(n.holdDuration)
              ? (n.holdDuration > 50 ? n.holdDuration : n.holdDuration * 1000)
              : (Number.isFinite(n.duration) ? (n.duration > 50 ? n.duration : n.duration * 1000) : 700));
        const holdDuration = Math.max(150, Number.isFinite(rawDur) ? rawDur : 700);
        const endT = Number.isFinite(n.end_timestamp_ms) ? n.end_timestamp_ms : (nt + holdDuration);
        n._riverFlowEndPos = this._getRiverFlowPos(endT);
      }
    }
  }

  _getRiverFlowPos(timeMs) {
    if (!this._riverFlowPosTable || this._riverFlowPosTable.length === 0) {
      this._prepareRiverChoreography();
    }
    const table = this._riverFlowPosTable;
    if (!table || table.length === 0) return timeMs;
    const minT = this._riverFlowMinT || -3000;
    const stepMs = this._riverFlowStepMs || 25;
    const fIdx = (timeMs - minT) / stepMs;
    if (fIdx <= 0) {
      return table[0] + (timeMs - minT) * (this._riverSpeedMultTable ? this._riverSpeedMultTable[0] : 1.0);
    }
    const maxIdx = table.length - 1;
    if (fIdx >= maxIdx) {
      const lastT = minT + maxIdx * stepMs;
      return table[maxIdx] + (timeMs - lastT) * (this._riverSpeedMultTable ? this._riverSpeedMultTable[maxIdx] : 1.0);
    }
    const i0 = fIdx | 0;
    const frac = fIdx - i0;
    return table[i0] + (table[i0 + 1] - table[i0]) * frac;
  }

  _getRiverSpeedMult(timeMs) {
    const table = this._riverSpeedMultTable;
    if (!table || table.length === 0) return 1.0;
    const minT = this._riverFlowMinT || -3000;
    const stepMs = this._riverFlowStepMs || 25;
    const fIdx = (timeMs - minT) / stepMs;
    if (fIdx <= 0) return table[0] || 1.0;
    const maxIdx = table.length - 1;
    if (fIdx >= maxIdx) return table[maxIdx] || 1.0;
    const i0 = fIdx | 0;
    const frac = fIdx - i0;
    return table[i0] + (table[i0 + 1] - table[i0]) * frac;
  }

  _emitRiverTapRipple(x, y, scale = 1.0, isStrongHit = false) {
    if (!this._riverTapRipples) this._riverTapRipples = [];
    if (this._riverTapRipples.length >= 24) this._riverTapRipples.shift();
    this._riverTapRipples.push({
      x,
      y,
      scale: scale || 1.0,
      age: 0,
      duration: isStrongHit ? 0.68 : 0.54,
      maxRx: (isStrongHit ? 82 : 66) * (scale || 1.0),
      isStrong: isStrongHit
    });

    if (!this._riverWaterCrowns) this._riverWaterCrowns = [];
    if (this._riverWaterCrowns.length >= 12) this._riverWaterCrowns.shift();
    this._riverWaterCrowns.push({
      x,
      y,
      scale: scale || 1.0,
      age: 0,
      duration: isStrongHit ? 0.36 : 0.28,
      seed: Math.random() * 10
    });
  }

  _emitRiverSplash(x, y, scale, count = 8, isHoldSplash = false) {
    if (!this._riverSplashes) this._riverSplashes = [];
    if (!this._riverSplashPool) this._riverSplashPool = [];
    for (let i = 0; i < count; i++) {
      if (this._riverSplashes.length >= 110) break;
      const sp = this._riverSplashPool.length > 0 ? this._riverSplashPool.pop() : {};
      const ang = -Math.PI * (0.12 + Math.random() * 0.76);
      const spd = (isHoldSplash ? 65 : 115) + Math.random() * 115;
      sp.x = x + (Math.random() - 0.5) * 32 * scale;
      sp.y = y;
      sp.vx = Math.cos(ang) * spd * scale;
      sp.vy = Math.sin(ang) * spd * scale;
      sp.rad = (2.8 + Math.random() * 3.8) * scale;
      sp.age = 0;
      sp.duration = 0.38 + Math.random() * 0.26;
      sp.color = (i % 3 === 0) ? '#ffffff' : ((i % 2 === 0) ? '#bae6fd' : '#00f2fe');
      this._riverSplashes.push(sp);
    }
  }

  // Dibuja una Baldosa de Roca Flotante en 3D con Hondura Luminosa Tallada (Línea central o Flecha Swipe perfectamente centrada)
  drawRiverStoneKey(ctx, laneOrCx, cy, h, scale = 1.0, isPressed = false, isLarge = true, isSwipe = false, swipeDir = 'up', lyricText = null, noteIdx = 0, currentTime = 0) {
    ctx.save();

    let lane = 0;
    if (typeof laneOrCx === 'number') {
      if (laneOrCx <= 2.5) {
        lane = Math.max(0, Math.min(2, laneOrCx));
      } else {
        const laneW = this.width / 3;
        lane = Math.max(0, Math.min(2, Math.floor(laneOrCx / laneW)));
      }
    }

    // Flotabilidad natural sobre la corriente del agua (pequeño balanceo vertical hidrodinámico)
    const bobOffset = isPressed ? (4.0 * scale) : (Math.sin(currentTime * 0.0055 + noteIdx * 1.9) * 1.8 * scale);
    const y = cy + bobOffset;
    const y0 = y - h / 2;
    const y1 = y0 + h;

    const margin = Math.max(3.2, (isLarge ? 5.2 : 3.6) * scale);
    const x0Top = this.getLaneBoundaryX(lane, y0) + margin;
    const x1Top = this.getLaneBoundaryX(lane + 1, y0) - margin;
    const x0Bot = this.getLaneBoundaryX(lane, y1) + margin;
    const x1Bot = this.getLaneBoundaryX(lane + 1, y1) - margin;

    const r = Math.max(5, (isLarge ? 12 : 7) * scale);
    const cx = (x0Top + x1Top + x0Bot + x1Bot) / 4;
    const keyW = x1Bot - x0Bot;
    const keyH = y1 - y0;

    // 1. Estela de Espuma Blanca y Onda de Agua rodeando la base de la baldosa de roca flotante
    const foamExpand = (3.5 + Math.sin(currentTime * 0.009 + noteIdx) * 1.5) * scale;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
    ctx.lineWidth = Math.max(1.5, 2.8 * scale);
    tracePerspectiveQuad(
      ctx,
      x0Top - foamExpand * 0.7,
      x1Top + foamExpand * 0.7,
      x0Bot - foamExpand,
      x1Bot + foamExpand,
      y0 - foamExpand * 0.4,
      y1 + foamExpand * 0.75,
      r + 3 * scale
    );
    ctx.stroke();

    // Sombra sumergida azul abisal bajo la roca
    ctx.fillStyle = 'rgba(3, 22, 38, 0.55)';
    const shadowOff = (isLarge ? 5.5 : 3.2) * scale;
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0 + shadowOff, y1 + shadowOff, r);
    ctx.fill();

    // 2. Cara Frontal Esculpida en Roca Basáltica Mojada (Grosor 3D de bloque de piedra)
    const bevelH = Math.max(4, (isLarge ? 10.5 : 6.0) * scale);
    const yBevelTop = y1 - bevelH;
    const x0Bev = this.getLaneBoundaryX(lane, yBevelTop) + margin;
    const x1Bev = this.getLaneBoundaryX(lane + 1, yBevelTop) - margin;

    ctx.fillStyle = isPressed ? '#0f2942' : '#1e293b';
    tracePerspectiveQuad(ctx, x0Bev, x1Bev, x0Bot, x1Bot, yBevelTop, y1, r);
    ctx.fill();

    // Grietas verticales de cincelado en el borde frontal de la roca
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.lineWidth = Math.max(1.0, 1.6 * scale);
    ctx.beginPath();
    for (let f = 1; f <= 3; f++) {
      const frac = f * 0.25;
      const fxTop = x0Bev + (x1Bev - x0Bev) * frac;
      const fxBot = x0Bot + (x1Bot - x0Bot) * frac;
      ctx.moveTo(fxTop, yBevelTop + 1);
      ctx.lineTo(fxBot, y1 - 1);
    }
    ctx.stroke();

    // 3. Cara Superior de Baldosa de Piedra de Río Tallada (0 Gradient Allocations por frame para máxima fluidez en rápidos densos)
    ctx.fillStyle = isPressed ? '#0284c7' : (isSwipe ? '#3b495e' : '#334155');
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bev, x1Bev, y0, yBevelTop, r);
    ctx.fill();

    // Banda mineral superior iluminada por el sol sobre la roca húmeda
    const ySunBand = y0 + (yBevelTop - y0) * 0.46;
    const x0Sun = x0Top + (x0Bev - x0Top) * 0.46;
    const x1Sun = x1Top + (x1Bev - x1Top) * 0.46;
    ctx.fillStyle = isPressed ? 'rgba(125, 211, 252, 0.42)' : 'rgba(148, 163, 184, 0.28)';
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Sun, x1Sun, y0, ySunBand, r);
    ctx.fill();

    // Facetas minerales y textura de piedra cincelada en las esquinas
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.28)';
    ctx.lineWidth = Math.max(1.0, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(x0Top + r * 0.8, y0 + 3.5 * scale);
    ctx.lineTo(x1Top - r * 0.8, y0 + 3.5 * scale);
    ctx.moveTo(x0Top + 6 * scale, y0 + 5 * scale);
    ctx.lineTo(x0Bev + 5 * scale, yBevelTop - 4 * scale);
    ctx.moveTo(x1Top - 6 * scale, y0 + 5 * scale);
    ctx.lineTo(x1Bev - 5 * scale, yBevelTop - 4 * scale);
    ctx.stroke();

    // Pequeños toques de musgo esmeralda de río en dos esquinas opuestas de la roca
    if (!isPressed && isLarge) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.42)';
      ctx.beginPath();
      ctx.arc(x0Top + 9 * scale, y0 + 7 * scale, 4.2 * scale, 0, Math.PI * 2);
      ctx.arc(x1Bev - 10 * scale, yBevelTop - 6 * scale, 3.8 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Borde exterior cincelado de la baldosa de roca
    ctx.strokeStyle = isPressed ? '#e0f2fe' : '#94a3b8';
    ctx.lineWidth = Math.max(1.3, 1.9 * scale);
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0, y1, r);
    ctx.stroke();

    // ===========================================================================
    // 4. HONDURAS DE LA ROCA PERFECTAMENTE CENTRADAS EN LA CARA SUPERIOR (y0..yBevelTop)
    // ===========================================================================
    const cyGroove = (y0 + yBevelTop) * 0.50;
    const topFaceW = ((x1Top - x0Top) + (x1Bev - x0Bev)) * 0.5;
    const topFaceH = Math.max(12, yBevelTop - y0);

    if (!isSwipe) {
      if (lyricText) {
        const sp = this._getLyricKeySprite(lyricText, isPressed);
        const drawW = Math.min(topFaceW * 0.94, 132 * scale);
        const drawH = 42 * (drawW / 132);
        ctx.drawImage(sp, cx - drawW * 0.5, cyGroove - drawH * 0.5, drawW, drawH);
      } else {
        // HONDURA CENTRAL HORIZONTAL TALLADA EN EL CENTRO EXACTO DE LA ROCA
        const grooveW = topFaceW * 0.66;
        const grooveH = Math.max(6.8, 10.2 * scale);
        const gx = cx - grooveW * 0.5;
        const gy = cyGroove - grooveH * 0.5;
        const gr = grooveH * 0.5;

        // A. Labio inferior iluminado del surco de piedra (efecto de profundidad hundida 3D)
        ctx.fillStyle = 'rgba(226, 232, 240, 0.58)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(gx - 1.5 * scale, gy + 1.6 * scale, grooveW + 3 * scale, grooveH, gr);
        else ctx.rect(gx - 1.5 * scale, gy + 1.6 * scale, grooveW + 3 * scale, grooveH);
        ctx.fill();

        // B. Cavidad profunda oscura tallada en la roca (#090d16)
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = Math.max(1.2, 1.8 * scale);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(gx, gy, grooveW, grooveH, gr);
        else ctx.rect(gx, gy, grooveW, grooveH);
        ctx.fill();
        ctx.stroke();

        // C. Veta de agua/cristal bioluminiscente brillando dentro de la hondura de la roca
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const spreadX = 6.5 * scale;
        const spreadY = 4.5 * scale;
        ctx.fillStyle = 'rgba(0, 242, 254, 0.36)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(gx - spreadX, gy - spreadY, grooveW + spreadX * 2, grooveH + spreadY * 2, gr + spreadY);
        else ctx.rect(gx - spreadX, gy - spreadY, grooveW + spreadX * 2, grooveH + spreadY * 2);
        ctx.fill();

        const innerW = grooveW * 0.92;
        const innerH = Math.max(4.2, grooveH * 0.64);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.90)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - innerW * 0.5, cyGroove - innerH * 0.5, innerW, innerH, innerH * 0.5);
        else ctx.rect(cx - innerW * 0.5, cyGroove - innerH * 0.5, innerW, innerH);
        ctx.fill();

        const coreW = grooveW * 0.84;
        const coreH = Math.max(2.6, grooveH * 0.36);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - coreW * 0.5, cyGroove - coreH * 0.5, coreW, coreH, coreH * 0.5);
        else ctx.rect(cx - coreW * 0.5, cyGroove - coreH * 0.5, coreW, coreH);
        ctx.fill();

        ctx.restore();
      }
    } else {
      // HONDURA DE FLECHA SWIPE TALLADA EN EL CENTRO EXACTO DE LA CARA SUPERIOR DE LA ROCA
      const dir = String(swipeDir || 'up').toLowerCase();
      const arrowSpanW = Math.min(topFaceW * 0.32, 32 * scale);
      const arrowSpanH = Math.min(topFaceH * 0.32, 16 * scale);

      const traceArrowPath = (offsetX, offsetY) => {
        ctx.beginPath();
        if (dir === 'left') {
          ctx.moveTo(cx + arrowSpanW * 0.55 + offsetX, cyGroove - arrowSpanH + offsetY);
          ctx.lineTo(cx - arrowSpanW * 0.55 + offsetX, cyGroove + offsetY);
          ctx.lineTo(cx + arrowSpanW * 0.55 + offsetX, cyGroove + arrowSpanH + offsetY);
        } else if (dir === 'right') {
          ctx.moveTo(cx - arrowSpanW * 0.55 + offsetX, cyGroove - arrowSpanH + offsetY);
          ctx.lineTo(cx + arrowSpanW * 0.55 + offsetX, cyGroove + offsetY);
          ctx.lineTo(cx - arrowSpanW * 0.55 + offsetX, cyGroove + arrowSpanH + offsetY);
        } else if (dir === 'down') {
          ctx.moveTo(cx - arrowSpanW + offsetX, cyGroove - arrowSpanH * 0.55 + offsetY);
          ctx.lineTo(cx + offsetX, cyGroove + arrowSpanH * 0.55 + offsetY);
          ctx.lineTo(cx + arrowSpanW + offsetX, cyGroove - arrowSpanH * 0.55 + offsetY);
        } else {
          ctx.moveTo(cx - arrowSpanW + offsetX, cyGroove + arrowSpanH * 0.55 + offsetY);
          ctx.lineTo(cx + offsetX, cyGroove - arrowSpanH * 0.55 + offsetY);
          ctx.lineTo(cx + arrowSpanW + offsetX, cyGroove + arrowSpanH * 0.55 + offsetY);
        }
      };

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Bisel inferior de piedra iluminada de la hondura de flecha
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.68)';
      ctx.lineWidth = Math.max(7.5, 13.5 * scale);
      traceArrowPath(0, 1.8 * scale);
      ctx.stroke();

      // 2. Cavidad oscura profunda tallada en la roca
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = Math.max(6.5, 11.6 * scale);
      traceArrowPath(0, 0);
      ctx.stroke();

      // 3. Interior bioluminiscente turquesa y blanco puro dentro de la hondura de flecha
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.88)';
      ctx.lineWidth = Math.max(4.0, 7.2 * scale);
      traceArrowPath(0, 0);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2.2, 3.8 * scale);
      traceArrowPath(0, 0);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    if (!this._keyRectScratch) {
      this._keyRectScratch = { cx: 0, cy: 0, w: 0, h: 0 };
    }
    this._keyRectScratch.cx = cx;
    this._keyRectScratch.cy = cyGroove;
    this._keyRectScratch.w = keyW;
    this._keyRectScratch.h = keyH;
    return this._keyRectScratch;
  }

  // Dibuja un Hold como un Tronco de Madera Flotando en el Río con Corteza, Anillos de Madera, Musgo y Hendidura Luminosa
  _renderRiverWoodenLogHold(ctx, note, lane, currentTime, pHead, currentTailP, isBeingHeld, maxH3D) {
    const currentHeadP = isBeingHeld ? 1.0 : pHead;
    if (currentTailP > 1.25 || currentHeadP < -0.2) return;

    ctx.save();
    const segments = 10;
    const stringPoints = this._holdPointsBuffer || [];
    const timeSec = currentTime * 0.001;

    for (let s = 0; s <= segments; s++) {
      const frac = s / segments;
      const pStep = currentTailP + (currentHeadP - currentTailP) * frac;
      const ptCoord = this.getPerspectiveCoord(lane, pStep, this._coordScratch1);

      const standingEnvelope = Math.sin(Math.PI * frac);
      const bobX = isBeingHeld
        ? (Math.sin(timeSec * 26.0 + ptCoord.y * 0.08) * (4.2 * standingEnvelope * ptCoord.scale))
        : (Math.sin(timeSec * 4.2 + ptCoord.y * 0.03) * (1.8 * standingEnvelope * ptCoord.scale));

      const halfW = Math.max(6, ptCoord.laneW * 0.36);

      let pt = stringPoints[s];
      if (!pt) {
        pt = { x: 0, y: 0, scale: 1, laneW: 50, halfW: 20 };
        stringPoints[s] = pt;
      }
      pt.x = ptCoord.x + bobX;
      pt.y = ptCoord.y;
      pt.scale = ptCoord.scale;
      pt.laneW = ptCoord.laneW;
      pt.halfW = halfW;
    }

    // 1. Estela de Espuma Blanca de Río a ambos lados del Tronco Flotante
    ctx.strokeStyle = isBeingHeld ? 'rgba(167, 243, 208, 0.85)' : 'rgba(186, 230, 253, 0.62)';
    ctx.lineWidth = Math.max(2.2, 4.5 * stringPoints[segments].scale);
    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      const pt = stringPoints[s];
      const foamWave = Math.sin(timeSec * 10.0 + s * 1.3) * (2.5 * pt.scale);
      if (s === 0) ctx.moveTo(pt.x - pt.halfW - 4 * pt.scale + foamWave, pt.y);
      else ctx.lineTo(pt.x - pt.halfW - 4 * pt.scale + foamWave, pt.y);
    }
    for (let s = 0; s <= segments; s++) {
      const pt = stringPoints[s];
      const foamWave = Math.cos(timeSec * 10.0 + s * 1.3) * (2.5 * pt.scale);
      if (s === 0) ctx.moveTo(pt.x + pt.halfW + 4 * pt.scale + foamWave, pt.y);
      else ctx.lineTo(pt.x + pt.halfW + 4 * pt.scale + foamWave, pt.y);
    }
    ctx.stroke();

    // 2. Cuerpo Cilíndrico 3D del Tronco de Madera
    const barkPad = 3.2;
    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      const pt = stringPoints[s];
      if (s === 0) ctx.moveTo(pt.x - pt.halfW - barkPad, pt.y);
      else ctx.lineTo(pt.x - pt.halfW - barkPad, pt.y);
    }
    for (let s = segments; s >= 0; s--) {
      const pt = stringPoints[s];
      ctx.lineTo(pt.x + pt.halfW + barkPad, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#271001';
    ctx.fill();

    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      const pt = stringPoints[s];
      if (s === 0) ctx.moveTo(pt.x - pt.halfW, pt.y);
      else ctx.lineTo(pt.x - pt.halfW, pt.y);
    }
    for (let s = segments; s >= 0; s--) {
      const pt = stringPoints[s];
      ctx.lineTo(pt.x + pt.halfW, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#78350f';
    ctx.fill();

    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      const pt = stringPoints[s];
      const innerW = pt.halfW * 0.64;
      if (s === 0) ctx.moveTo(pt.x - innerW, pt.y);
      else ctx.lineTo(pt.x - innerW, pt.y);
    }
    for (let s = segments; s >= 0; s--) {
      const pt = stringPoints[s];
      const innerW = pt.halfW * 0.64;
      ctx.lineTo(pt.x + innerW, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#b45309';
    ctx.fill();

    // 3. Vetas longitudinales de la corteza de madera y parches de musgo verde de río
    ctx.strokeStyle = 'rgba(39, 16, 1, 0.65)';
    ctx.lineWidth = Math.max(1.4, 2.4 * stringPoints[segments].scale);
    ctx.beginPath();
    for (let side = -1; side <= 1; side += 2) {
      for (let s = 0; s <= segments; s++) {
        const pt = stringPoints[s];
        const bx = pt.x + side * pt.halfW * 0.48;
        if (s === 0) ctx.moveTo(bx, pt.y);
        else ctx.lineTo(bx, pt.y);
      }
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(34, 197, 94, 0.55)';
    for (let s = 2; s < segments; s += 3) {
      const pt = stringPoints[s];
      const side = (s % 2 === 0) ? -1 : 1;
      ctx.beginPath();
      ctx.ellipse(pt.x + side * pt.halfW * 0.68, pt.y, 5.5 * pt.scale, 9.5 * pt.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Hondura/Canal Central Tallado en el Tronco con Agua Bioluminiscente Fluyendo
    ctx.strokeStyle = '#1c0a00';
    ctx.lineWidth = Math.max(5.0, 9.2 * stringPoints[segments].scale);
    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      if (s === 0) ctx.moveTo(stringPoints[s].x, stringPoints[s].y);
      else ctx.lineTo(stringPoints[s].x, stringPoints[s].y);
    }
    ctx.stroke();

    ctx.strokeStyle = isBeingHeld ? '#34d399' : '#00f2fe';
    ctx.lineWidth = Math.max(3.0, 5.4 * stringPoints[segments].scale);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.6, 2.6 * stringPoints[segments].scale);
    ctx.stroke();

    // 5. Corte Transversal de Madera con Anillos en la Cola Superior del Tronco (tailPt)
    const tailPt = stringPoints[0];
    const logCapRx = Math.max(8, tailPt.halfW * 1.02);
    const logCapRy = Math.max(4.5, logCapRx * 0.42);
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = Math.max(2.0, 3.2 * tailPt.scale);
    ctx.beginPath();
    ctx.ellipse(tailPt.x, tailPt.y, logCapRx, logCapRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(146, 64, 14, 0.65)';
    ctx.lineWidth = Math.max(1.0, 1.5 * tailPt.scale);
    ctx.beginPath();
    ctx.ellipse(tailPt.x, tailPt.y, logCapRx * 0.65, logCapRy * 0.65, 0, 0, Math.PI * 2);
    ctx.ellipse(tailPt.x, tailPt.y, logCapRx * 0.32, logCapRy * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 6. CABEZA DEL TRONCO (Frente de madera tallada con Hondura de Timing Cian-Blanca centrada)
    const headPt = stringPoints[segments];
    const headW = headPt.halfW * 2.12;
    const headH = Math.min(34 * headPt.scale, maxH3D);
    const hx = headPt.x - headW * 0.5;
    const hy = headPt.y - headH * 0.5;
    const hr = Math.max(5, 9 * headPt.scale);

    ctx.fillStyle = isBeingHeld ? '#059669' : '#78350f';
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = Math.max(1.8, 2.6 * headPt.scale);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(hx, hy, headW, headH, hr);
    else ctx.rect(hx, hy, headW, headH);
    ctx.fill();
    ctx.stroke();

    const grooveW = headW * 0.72;
    const grooveH = Math.max(6.0, 9.0 * headPt.scale);
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(headPt.x - grooveW * 0.5, headPt.y - grooveH * 0.5, grooveW, grooveH, grooveH * 0.5);
    else ctx.rect(headPt.x - grooveW * 0.5, headPt.y - grooveH * 0.5, grooveW, grooveH);
    ctx.fill();

    ctx.fillStyle = isBeingHeld ? '#6ee7b7' : '#00f2fe';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(headPt.x - grooveW * 0.46, headPt.y - grooveH * 0.32, grooveW * 0.92, grooveH * 0.64, grooveH * 0.32);
    else ctx.rect(headPt.x - grooveW * 0.46, headPt.y - grooveH * 0.32, grooveW * 0.92, grooveH * 0.64);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(headPt.x - grooveW * 0.40, headPt.y - grooveH * 0.18, grooveW * 0.80, grooveH * 0.36, grooveH * 0.18);
    else ctx.rect(headPt.x - grooveW * 0.40, headPt.y - grooveH * 0.18, grooveW * 0.80, grooveH * 0.36);
    ctx.fill();

    ctx.restore();
  }

  renderRiverModeOverlay(ctx, currentTime) {
    if (!this._riverAssetsReady) {
      this.initRiverModeAssets();
      this._prepareRiverChoreography();
    } else if (!this._riverFlowPosTable || this._riverFlowPosTable.length === 0) {
      this._prepareRiverChoreography();
    }

    const nowPerf = this._frameNow || performance.now();
    const dt = Math.min(0.05, Math.max(0.004, (nowPerf - (this._riverLastOverlayNow || nowPerf)) / 1000));
    this._riverLastOverlayNow = nowPerf;

    const w = this.width || 360;
    const h = this.height || 640;
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (h * 0.84);
    const curSpeedMult = this._getRiverSpeedMult(currentTime);

    ctx.save();

    // 1. Detectar impactos recientes en los 3 carriles para disparar Salpicaduras de Agua, Ondas y Saltos de Focas / Peces Koi
    if (!this._riverLastLaneFlash) this._riverLastLaneFlash = [0, 0, 0];
    for (let l = 0; l < 3; l++) {
      const ft = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
      if (ft > this._riverLastLaneFlash[l] + 0.05) {
        const hitCoord = this.getPerspectiveCoord(l, 1.0, this._coordScratch0);
        this._emitRiverSplash(hitCoord.x, hitY - 6, hitCoord.scale, 10, false);
        this._emitRiverTapRipple(hitCoord.x, hitY, hitCoord.scale, true);

        // En zonas de rápidos o cada varios impactos, una Foca realista o un Pez Koi salta alegremente en arco fuera del agua
        if (this._riverLeapingFish && this._riverLeapingFish.length < 2 && Math.random() < (curSpeedMult > 1.20 ? 0.26 : 0.12)) {
          const fromSide = (l === 0) ? -0.15 : ((l === 2) ? 2.15 : (Math.random() < 0.5 ? -0.1 : 2.1));
          const toLane = Math.max(0.1, Math.min(1.9, l + (fromSide < 1 ? 0.65 : -0.65)));
          const isSealJump = Math.random() < 0.55;
          this._riverLeapingFish.push({
            fromLane: fromSide,
            toLane: toLane,
            p: 0.34 + Math.random() * 0.38,
            age: 0,
            duration: isSealJump ? 0.88 : 0.76,
            variant: Math.random() < 0.5 ? 0 : 1,
            isSeal: isSealJump
          });
        }
      }
      this._riverLastLaneFlash[l] = ft;

      // Si se está manteniendo pulsado un Tronco de Madera (Hold), emitir espuma de agua continua en la línea de golpeo
      if (this.activeHolds && this.activeHolds.has(l) && Math.random() < 0.50) {
        const holdCoord = this.getPerspectiveCoord(l, 1.0, this._coordScratch0);
        this._emitRiverSplash(holdCoord.x, hitY - 4, holdCoord.scale, 3, true);
      }
    }

    // 2. Ondas de Agua Concéntricas 3D al Tocar (Water Tap Ripples)
    if (this._riverTapRipples && this._riverTapRipples.length > 0) {
      for (let i = this._riverTapRipples.length - 1; i >= 0; i--) {
        const rp = this._riverTapRipples[i];
        rp.age += dt;
        if (rp.age >= rp.duration) {
          this._riverTapRipples.splice(i, 1);
          continue;
        }
        const u = rp.age / rp.duration;
        const ease = 1 - Math.pow(1 - u, 2.2);
        const alpha = Math.max(0, (1 - u) * (rp.isStrong ? 0.92 : 0.78));

        for (let ring = 0; ring < 3; ring++) {
          const ringFrac = Math.max(0.08, ease - ring * 0.22);
          if (ringFrac <= 0.08) continue;
          const rx = rp.maxRx * ringFrac;
          const ry = rx * 0.42;
          ctx.strokeStyle = ring === 0
            ? `rgba(255, 255, 255, ${alpha.toFixed(3)})`
            : (ring === 1 ? `rgba(0, 242, 254, ${(alpha * 0.82).toFixed(3)})` : `rgba(186, 230, 253, ${(alpha * 0.65).toFixed(3)})`);
          ctx.lineWidth = Math.max(1.1, (3.4 - ring * 0.8) * (1 - u * 0.5) * rp.scale);
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 3. Coronas de Salpicadura Líquida 3D al Tocar (Water Splash Crowns)
    if (this._riverWaterCrowns && this._riverWaterCrowns.length > 0) {
      for (let i = this._riverWaterCrowns.length - 1; i >= 0; i--) {
        const wc = this._riverWaterCrowns[i];
        wc.age += dt;
        if (wc.age >= wc.duration) {
          this._riverWaterCrowns.splice(i, 1);
          continue;
        }
        const u = wc.age / wc.duration;
        const crownLift = Math.sin(u * Math.PI);
        const alpha = Math.max(0, 1 - u);
        const spreadW = (24 + u * 36) * wc.scale;
        const crownH = (18 + crownLift * 24) * wc.scale;

        ctx.fillStyle = `rgba(186, 230, 253, ${(alpha * 0.65).toFixed(3)})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.92).toFixed(3)})`;
        ctx.lineWidth = 1.6 * wc.scale;
        ctx.beginPath();
        const jets = 5;
        for (let j = 0; j < jets; j++) {
          const jf = (j / (jets - 1)) - 0.5;
          const bx = wc.x + jf * spreadW * 0.72;
          const tx = wc.x + jf * spreadW * 1.18;
          const ty = wc.y - crownH * (1 - Math.abs(jf) * 0.35);
          ctx.moveTo(bx - 3.5 * wc.scale, wc.y);
          ctx.quadraticCurveTo((bx + tx) * 0.5, ty + 4 * wc.scale, tx, ty);
          ctx.quadraticCurveTo((bx + tx) * 0.5, ty + 8 * wc.scale, bx + 3.5 * wc.scale, wc.y);
        }
        ctx.fill();
        ctx.stroke();
      }
    }

    // 4. Actualizar y dibujar Focas Realistas y Peces Koi Saltando fuera del agua en parábola 3D
    if (this._riverLeapingFish && this._riverLeapingFish.length > 0) {
      for (let i = this._riverLeapingFish.length - 1; i >= 0; i--) {
        const lf = this._riverLeapingFish[i];
        lf.age += dt;
        if (lf.age >= lf.duration) {
          const endCoord = this.getPerspectiveCoord(lf.toLane, lf.p, this._coordScratch1);
          this._emitRiverSplash(endCoord.x, endCoord.y, endCoord.scale, 8, false);
          this._emitRiverTapRipple(endCoord.x, endCoord.y, endCoord.scale, false);
          this._riverLeapingFish.splice(i, 1);
          continue;
        }
        const u = lf.age / lf.duration;
        const curLane = lf.fromLane + (lf.toLane - lf.fromLane) * u;
        const fCoord = this.getPerspectiveCoord(curLane, lf.p, this._coordScratch1);
        const arcLift = Math.sin(u * Math.PI) * (72 * fCoord.scale);
        const dirSign = lf.toLane >= lf.fromLane ? 1 : -1;
        const pitchAng = (dirSign > 0 ? 0 : Math.PI) + dirSign * (0.5 - u) * 1.15;

        ctx.fillStyle = 'rgba(2, 18, 32, 0.38)';
        ctx.beginPath();
        ctx.ellipse(fCoord.x, fCoord.y, (lf.isSeal ? 26 : 18) * fCoord.scale, (lf.isSeal ? 8 : 6) * fCoord.scale, 0, 0, Math.PI * 2);
        ctx.fill();

        if (lf.isSeal && this._riverSealSprites && this._riverSealSprites.length > 0) {
          const sealImg = this._riverSealSprites[lf.variant % this._riverSealSprites.length];
          const sw = 88 * fCoord.scale;
          const sh = 58 * fCoord.scale;
          ctx.save();
          ctx.translate(fCoord.x, fCoord.y - arcLift);
          ctx.rotate(pitchAng);
          if (dirSign < 0) ctx.scale(1, -1);
          ctx.drawImage(sealImg, -sw * 0.5, -sh * 0.5, sw, sh);
          ctx.restore();
        } else if (this._riverKoiSprites && this._riverKoiSprites.length > 0) {
          const koiImg = this._riverKoiSprites[lf.variant % this._riverKoiSprites.length];
          const kw = 58 * fCoord.scale;
          const kh = 38 * fCoord.scale;
          ctx.save();
          ctx.translate(fCoord.x, fCoord.y - arcLift);
          ctx.rotate(pitchAng);
          if (dirSign < 0) ctx.scale(1, -1);
          ctx.drawImage(koiImg, -kw * 0.5, -kh * 0.5, kw, kh);
          ctx.restore();
        }
      }
    }

    // 5. Partículas de Salpicaduras de Agua Cristalina (swap-and-pop O(1) sin GC)
    if (this._riverSplashes && this._riverSplashes.length > 0) {
      let sLen = this._riverSplashes.length;
      for (let i = sLen - 1; i >= 0; i--) {
        const sp = this._riverSplashes[i];
        sp.age += dt;
        if (sp.age >= sp.duration) {
          this._riverSplashes[i] = this._riverSplashes[sLen - 1];
          this._riverSplashes.pop();
          sLen--;
          if (this._riverSplashPool.length < 110) this._riverSplashPool.push(sp);
          continue;
        }
        const p = sp.age / sp.duration;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 290 * dt;
        ctx.globalAlpha = Math.max(0, 1 - p);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(1.2, sp.rad * (1 - p * 0.35)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  // =========================================================================
  // MODO BUSCAMINAS (MINESWEEPER RHYTHM & MEMORY ENGINE)
  // =========================================================================

  _injectMinesweeperNotes() {
    if (!this.notes || this.notes.length === 0) return;
    const realNotes = this.notes.filter(n => n && !n.isMine);
    if (realNotes.length === 0) return;

    const nLanes = this.numLanes || 3;
    const firstT = Math.max(2400, (realNotes[0].timestamp_ms || 2000) + 600);
    const lastT = (realNotes[realNotes.length - 1].end_timestamp_ms || realNotes[realNotes.length - 1].timestamp_ms || 0) - 1200;
    if (lastT <= firstT) return;

    const isLaneBusyAt = (lane, tMs, marginMs = 265) => {
      for (let i = 0; i < realNotes.length; i++) {
        const rn = realNotes[i];
        const rtStart = rn.timestamp_ms || 0;
        const rtEnd = rn.end_timestamp_ms || rtStart;
        if (rtStart - tMs > marginMs + 400) break;
        if (rn.lane === lane) {
          if (tMs >= (rtStart - marginMs) && tMs <= (rtEnd + marginMs)) {
            return true;
          }
        }
      }
      return false;
    };

    const countBusyLanesAt = (tMs, marginMs = 175) => {
      let busy = 0;
      for (let l = 0; l < nLanes; l++) {
        if (isLaneBusyAt(l, tMs, marginMs)) busy++;
      }
      return busy;
    };

    const mineNotes = [];
    let cursorMs = firstT + 400 + Math.random() * 900;
    let mineIdx = 0;

    while (cursorMs < lastT) {
      // Las minas son teclas extra aleatorias (no tienen por qué ir sincronizadas con el pulso musical)
      const jitterMs = Math.round((Math.random() - 0.5) * 420);
      const candidateTime = Math.max(2200, Math.round(cursorMs + jitterMs));

      // Garantizar que no se bloqueen todos los carriles a la vez
      if (countBusyLanesAt(candidateTime, 180) < nLanes - 1) {
        // Probar carriles en orden aleatorio
        const lanesOrder = [];
        for (let l = 0; l < nLanes; l++) lanesOrder.push(l);
        for (let i = lanesOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = lanesOrder[i];
          lanesOrder[i] = lanesOrder[j];
          lanesOrder[j] = tmp;
        }

        let chosenLane = -1;
        for (const l of lanesOrder) {
          if (!isLaneBusyAt(l, candidateTime, 280)) {
            chosenLane = l;
            break;
          }
        }

        if (chosenLane !== -1) {
          mineNotes.push({
            id: `mine_${mineIdx++}_${candidateTime}`,
            lane: chosenLane,
            column: chosenLane,
            track: chosenLane,
            type: 'tap',
            isMine: true,
            time: candidateTime / 1000,
            timeMs: candidateTime,
            timestamp_ms: candidateTime,
            duration_ms: 0,
            holdDuration: 0,
            end_timestamp_ms: null,
            lyric: null,
            hit: false,
            holding: false,
            holdCompleted: false,
            missed: false,
            processed: false,
            _mineSeed: Math.random() * 100
          });
        }
      }

      // Siguiente mina entre 1.65s y 3.25s después
      cursorMs += 1650 + Math.random() * 1600;
    }

    if (mineNotes.length > 0) {
      const combined = [...realNotes, ...mineNotes].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
      const cLen = combined.length;
      for (let i = 0; i < cLen; i++) {
        const curN = combined[i];
        let diff = Infinity;
        const maxJ = Math.min(cLen, i + 40);
        for (let j = i + 1; j < maxJ; j++) {
          const nextN = combined[j];
          if (nextN.timestamp_ms - curN.timestamp_ms > 3000) break;
          if (nextN.lane === curN.lane && nextN.timestamp_ms > curN.timestamp_ms) {
            diff = nextN.timestamp_ms - curN.timestamp_ms;
            break;
          }
        }
        curN.nextSameLaneDiffMs = diff;
      }
      this.notes = combined;
      console.log(`[Buscaminas] Inyectadas ${mineNotes.length} teclas trampa con minas camuflables.`);
    }
  }

  _emitMineDodgedFeedback(lane) {
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const coord = this.getPerspectiveCoord(lane, 1.0, this._coordScratch0);
    if (!this._mineFloatingPenalties) this._mineFloatingPenalties = [];
    this._mineFloatingPenalties.push({
      x: coord.x,
      y: hitY - 18,
      vy: -42,
      text: '✓ MINA ESQUIVADA',
      color: '#10b981',
      age: 0,
      duration: 0.72,
      scale: 0.86
    });
  }

  playMineExplosionSound() {
    try {
      const ctx = (this.synth && this.synth.audioCtx)
        ? this.synth.audioCtx
        : null;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // 1. Onda de choque sub-grave sísmica (Impacto de artillería 125Hz -> 20Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(135, now);
      subOsc.frequency.exponentialRampToValueAtTime(34, now + 0.18);
      subOsc.frequency.exponentialRampToValueAtTime(18, now + 0.75);
      subGain.gain.setValueAtTime(0.95, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.84);

      // 2. Punch medio saturado de detonación metálica
      const punchOsc = ctx.createOscillator();
      const punchGain = ctx.createGain();
      punchOsc.type = 'sawtooth';
      punchOsc.frequency.setValueAtTime(240, now);
      punchOsc.frequency.exponentialRampToValueAtTime(28, now + 0.32);
      punchGain.gain.setValueAtTime(0.55, now);
      punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      punchOsc.connect(punchGain);
      punchGain.connect(ctx.destination);
      punchOsc.start(now);
      punchOsc.stop(now + 0.36);

      // 3. Explosión pirotécnica de banda ancha + metralla de teclas destruidas (Ruido filtrado)
      const bufLen = Math.floor(ctx.sampleRate * 1.15);
      const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const t = i / bufLen;
        const crackle = (Math.random() < 0.04) ? (Math.random() * 2 - 1) * 1.8 : 0;
        data[i] = ((Math.random() * 2 - 1) * Math.pow(1 - t, 1.35)) + crackle * (1 - t);
      }

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3400, now);
      filter.frequency.exponentialRampToValueAtTime(240, now + 0.95);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.92, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.10);

      noiseSrc.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 1.12);
    } catch (_) {}
  }

  triggerMineExplosion(mineNote, hitX, hitY, currentTime) {
    if (!mineNote) return;
    mineNote.hit = true;
    mineNote.processed = true;

    this.playMineExplosionSound();

    const scrollDur = (Number.isFinite(this.scrollDurationMs) && this.scrollDurationMs > 0) ? this.scrollDurationMs : 1400;
    const invScrollDur = 1.0 / scrollDur;
    const isLarge = (this.keyStyle !== 'compact');
    const curMult = Math.max(1, this.multiplier || 1);

    if (!this._shatteredKeyFragments) this._shatteredKeyFragments = [];
    if (!this._mineFloatingPenalties) this._mineFloatingPenalties = [];
    if (!this._mineExplosions) this._mineExplosions = [];

    let totalLostPoints = 0;
    let destroyedRealNotes = 0;

    const spawnKeyShatterAt = (kx, ky, kScale, isMineTarget, notePoints) => {
      const shardCount = isMineTarget ? 14 : 9;
      for (let s = 0; s < shardCount; s++) {
        const ang = (s / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
        const distFromBlast = Math.hypot(kx - hitX, ky - hitY);
        const blastDirX = distFromBlast > 8 ? (kx - hitX) / distFromBlast : Math.cos(ang);
        const blastDirY = distFromBlast > 8 ? (ky - hitY) / distFromBlast : Math.sin(ang);
        const speed = (180 + Math.random() * 340) * (isMineTarget ? 1.25 : 1.0);
        this._shatteredKeyFragments.push({
          x: kx + (Math.random() - 0.5) * 28 * kScale,
          y: ky + (Math.random() - 0.5) * 18 * kScale,
          vx: Math.cos(ang) * speed * 0.65 + blastDirX * speed * 0.75,
          vy: Math.sin(ang) * speed * 0.65 + blastDirY * speed * 0.55 - (120 + Math.random() * 160),
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 18,
          w: (12 + Math.random() * 18) * kScale,
          h: (8 + Math.random() * 14) * kScale,
          age: 0,
          duration: 0.75 + Math.random() * 0.40,
          isMineShard: isMineTarget,
          rimColor: isMineTarget ? (s % 2 === 0 ? '#ff3b00' : '#fde047') : (s % 3 === 0 ? '#00f2fe' : '#ffffff'),
          bodyColor: isMineTarget ? '#27120b' : '#161924'
        });
      }

      if (!isMineTarget && notePoints > 0) {
        this._mineFloatingPenalties.push({
          x: kx,
          y: ky - 8,
          vy: -65 - Math.random() * 25,
          text: `-${notePoints}`,
          color: '#ff3b30',
          age: 0,
          duration: 0.95,
          scale: Math.max(0.85, Math.min(1.25, kScale * 1.15))
        });
      }
    };

    // Fragmentar la propia tecla mina en el epicentro
    spawnKeyShatterAt(hitX, hitY, 1.0, true, 0);

    // Buscar y destruir TODAS las teclas visibles actualmente en pantalla
    const startIdx = Math.max(0, (this.firstActiveNoteIndex || 0) - 2);
    const nLen = this.notes.length;
    for (let i = startIdx; i < nLen; i++) {
      const n = this.notes[i];
      if (!n || n === mineNote || n.holdCompleted) continue;
      if (n.hit && !n.holding) continue;
      if (n.missed || n.processed) continue;

      const noteT = n.timestamp_ms ?? n.timeMs ?? 0;
      const timeUntilHit = noteT - currentTime;
      const pHead = 1.0 - (timeUntilHit * invScrollDur);

      if (timeUntilHit > scrollDur * 1.05 && !n.holding) break;

      const isVisibleOnScreen = (pHead >= -0.04 && pHead <= 1.12) || Boolean(n.holding);
      if (!isVisibleOnScreen) continue;

      // Destruir esta tecla en pantalla sin provocar Game Over ni Miss
      n.hit = true;
      n.processed = true;
      n.holdCompleted = true;
      n.holding = false;
      if (this.activeHolds && this.activeHolds.has(n.lane)) {
        const activeH = this.activeHolds.get(n.lane);
        if (activeH && activeH.note === n) {
          this.activeHolds.delete(n.lane);
        }
      }

      const clampedP = Math.max(0.04, Math.min(1.0, pHead));
      const nCoord = this.getPerspectiveCoord(n.lane ?? 0, clampedP, this._coordScratch1);

      let noteWorth = 0;
      if (!n.isMine) {
        destroyedRealNotes++;
        if (n.type === 'hold') {
          const durSec = Math.max(0.2, (n.duration_ms || 600) / 1000);
          noteWorth = (450 + Math.round(260 * durSec)) * curMult;
        } else {
          noteWorth = 450 * curMult;
        }
        totalLostPoints += noteWorth;
      }

      spawnKeyShatterAt(nCoord.x, nCoord.y, nCoord.scale, Boolean(n.isMine), noteWorth);
    }

    // Si no había ninguna otra tecla visible en ese instante exacto, penalizar el valor base de la explosión
    if (totalLostPoints === 0) {
      totalLostPoints = 450 * curMult;
    }

    // Restar los puntos de todas las teclas explotadas y reiniciar el combo a 0 (¡No pierdes la partida!)
    this.score = Math.max(0, (this.score || 0) - totalLostPoints);
    this.displayScore = this.score;
    this.combo = 0;
    this.streakCount = 0;
    this.multiplier = 1;

    if (this.ui && typeof this.ui.onScoreUpdate === 'function') {
      this.ui.onScoreUpdate(this.score, this.combo, this.stars, this.multiplier, null, 0);
    }

    // Iluminar todos los carriles en rojo incandescente de onda expansiva
    const maxL = Math.max(4, this.numLanes || 3);
    for (let l = 0; l < maxL; l++) {
      this.laneGlows[l] = 1.0;
      if (this.laneFlashTimers) this.laneFlashTimers[l] = 0.48;
      if (this.laneFlashColors) this.laneFlashColors[l] = '#ff2a00';
    }

    // Sacudida sísmica de cámara
    this._mineShakeIntensity = 24.0;

    // Crear explosión volumétrica ultra-realista en el epicentro
    const fireballs = [];
    for (let f = 0; f < 28; f++) {
      const ang = Math.random() * Math.PI * 2;
      const distSpd = (25 + Math.random() * 240);
      const isCore = f < 8;
      fireballs.push({
        x: hitX + (Math.random() - 0.5) * 18,
        y: hitY + (Math.random() - 0.5) * 14,
        vx: Math.cos(ang) * distSpd,
        vy: Math.sin(ang) * distSpd * 0.75 - (45 + Math.random() * 135),
        r0: isCore ? (22 + Math.random() * 24) : (14 + Math.random() * 26),
        rMax: isCore ? (68 + Math.random() * 55) : (48 + Math.random() * 64),
        delay: isCore ? 0 : Math.random() * 0.08,
        turbulence: (Math.random() - 0.5) * 6.0,
        isSmokePlume: f >= 18
      });
    }

    const sparks = [];
    for (let sp = 0; sp < 46; sp++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 220 + Math.random() * 580;
      sparks.push({
        x: hitX,
        y: hitY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (90 + Math.random() * 180),
        len: 10 + Math.random() * 18,
        size: 1.8 + Math.random() * 2.6,
        color: sp % 3 === 0 ? '#ffffff' : (sp % 3 === 1 ? '#fde047' : '#ff4500')
      });
    }

    this._mineExplosions.push({
      x: hitX,
      y: hitY,
      age: 0,
      duration: 1.25,
      lostPoints: totalLostPoints,
      destroyedNotes: destroyedRealNotes,
      fireballs,
      sparks
    });

    // Texto flotante gigante del impacto de la mina
    this._mineFloatingPenalties.push({
      x: this.width * 0.5,
      y: hitY - 76,
      vy: -38,
      text: `💥 ¡BOOM! -${totalLostPoints.toLocaleString()} PTS`,
      color: '#fde047',
      stroke: '#991b1b',
      age: 0,
      duration: 1.35,
      scale: 1.32,
      isHeadline: true
    });

    this.addJudgement(`💥 -${totalLostPoints} PTS`, '#ff3b00', mineNote.lane ?? 1);
  }

  updateMinesweeperEffects(dt) {
    if (this._mineShakeIntensity > 0) {
      this._mineShakeIntensity = Math.max(0, this._mineShakeIntensity - dt * 42.0);
    }

    if (this._mineExplosions && this._mineExplosions.length > 0) {
      for (let i = this._mineExplosions.length - 1; i >= 0; i--) {
        const exp = this._mineExplosions[i];
        exp.age += dt;
        if (exp.age >= exp.duration) {
          this._mineExplosions.splice(i, 1);
          continue;
        }
        for (let f = 0; f < exp.fireballs.length; f++) {
          const fb = exp.fireballs[f];
          if (exp.age < fb.delay) continue;
          fb.x += fb.vx * dt;
          fb.y += fb.vy * dt;
          fb.vx *= (1 - dt * 2.8);
          fb.vy *= (1 - dt * 2.2);
          fb.vy -= 38 * dt; // Flotabilidad térmica ascendente del humo/fuego
        }
        for (let s = 0; s < exp.sparks.length; s++) {
          const sp = exp.sparks[s];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 680 * dt; // Gravedad balística
          sp.vx *= (1 - dt * 1.4);
        }
      }
    }

    if (this._shatteredKeyFragments && this._shatteredKeyFragments.length > 0) {
      for (let i = this._shatteredKeyFragments.length - 1; i >= 0; i--) {
        const sh = this._shatteredKeyFragments[i];
        sh.age += dt;
        if (sh.age >= sh.duration) {
          this._shatteredKeyFragments.splice(i, 1);
          continue;
        }
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.vy += 620 * dt;
        sh.rot += sh.rotSpeed * dt;
      }
    }

    if (this._mineFloatingPenalties && this._mineFloatingPenalties.length > 0) {
      for (let i = this._mineFloatingPenalties.length - 1; i >= 0; i--) {
        const fp = this._mineFloatingPenalties[i];
        fp.age += dt;
        if (fp.age >= fp.duration) {
          this._mineFloatingPenalties.splice(i, 1);
          continue;
        }
        fp.y += fp.vy * dt;
        fp.vy *= (1 - dt * 2.4);
      }
    }
  }

  renderMinesweeperKey(ctx, note, lane, cy, h, scale, pHead, isLarge, currentTime) {
    // 1. Dibujar siempre la tecla base 3D (para que al camuflarse sea 100% idéntica a una tecla normal)
    const tapKey = this.drawIvoryKey(ctx, lane, cy, h, scale, false, isLarge, false, null);

    // Fases de memoria y camuflaje de la mina dentro de la tecla:
    // - pHead <= 0.36: Mina naval/táctica 100% visible dentro de una cámara blindada abierta en la tecla
    // - 0.36 < pHead < 0.56: Animación ultra chula de compuertas de titanio cerrándose + escáner láser holográfico
    // - pHead >= 0.56: 100% camuflada como una tecla normal (¡toca recordarla!)
    const REVEAL_END_P = 0.36;
    const CAMO_END_P = 0.56;

    if (pHead >= CAMO_END_P) {
      return tapKey;
    }

    const camoProgress = pHead <= REVEAL_END_P
      ? 0.0
      : Math.max(0.0, Math.min(1.0, (pHead - REVEAL_END_P) / (CAMO_END_P - REVEAL_END_P)));

    // Easing cúbico suave para el cierre mecánico de las compuertas
    const shutterClose = camoProgress < 0.5
      ? 4 * camoProgress * camoProgress * camoProgress
      : 1 - Math.pow(-2 * camoProgress + 2, 3) / 2;

    const cx = tapKey.cx;
    const cyMid = tapKey.cy;
    const keyW = tapKey.w;
    const keyH = tapKey.h;

    const nLanes = this.numLanes || 3;
    const margin = Math.max(2.2, (nLanes === 4 ? (isLarge ? 3.5 : 2.6) : (isLarge ? 6.5 : 4.5)) * scale);
    const bevelH = Math.max(3, (isLarge ? 9 : 5) * scale);
    const y0 = cy - h * 0.5 + 2.2 * scale;
    const y1 = cy + h * 0.5 - bevelH - 1.5 * scale;
    const x0Top = this.getLaneBoundaryX(lane, y0) + margin;
    const x1Top = this.getLaneBoundaryX(lane + 1, y0) - margin;
    const x0Bot = this.getLaneBoundaryX(lane, y1) + margin;
    const x1Bot = this.getLaneBoundaryX(lane + 1, y1) - margin;
    const cornerR = Math.max(3, (isLarge ? 7 : 4) * scale);

    ctx.save();

    // A. CÁMARA INTERNA ABIERTA DE LA TECLA Y MINA TÁCTICA 3D (Mientras no esté 100% cerrada la compuerta)
    if (shutterClose < 0.99) {
      // Fondo oscuro acorazado de la cavidad interior de la tecla
      ctx.fillStyle = '#090406';
      tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0, y1, cornerR);
      ctx.fill();

      // Borde interior de peligro rojo/ámbar pulsante
      const pulse = 0.5 + 0.5 * Math.sin(currentTime * 0.018 + (note._mineSeed || 0));
      ctx.strokeStyle = `rgba(239, 68, 68, ${(0.75 + pulse * 0.25) * (1 - shutterClose * 0.7)})`;
      ctx.lineWidth = Math.max(1.5, 2.4 * scale);
      tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0, y1, cornerR);
      ctx.stroke();

      // Rejilla/bandas diagonales de advertencia en las esquinas internas de la tecla
      const innerW = (x1Bot - x0Bot);
      const innerH = Math.max(8, y1 - y0);
      ctx.fillStyle = `rgba(245, 158, 11, ${(0.28 * (1 - shutterClose)).toFixed(3)})`;
      ctx.fillRect(cx - innerW * 0.42, cyMid - innerH * 0.36, innerW * 0.84, innerH * 0.72);

      // Escala de la mina dentro de la tecla (sobredimensionada ligeramente en el horizonte para máxima visibilidad)
      const mineScale = (1.0 - shutterClose * 0.35) * Math.max(0.72, scale * 1.18);
      const mineR = Math.min(keyW * 0.31, Math.max(keyH * 0.42, 13.5 * mineScale));

      // 1. Onda de radar/sonar roja expandiéndose desde la mina dentro de la tecla
      const sonarP = ((currentTime * 0.0028 + (note._mineSeed || 0)) % 1.0);
      const sonarR = mineR * (0.85 + sonarP * 1.15);
      ctx.strokeStyle = `rgba(255, 42, 42, ${((1 - sonarP) * 0.90 * (1 - shutterClose)).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.4, 2.2 * scale);
      ctx.beginPath();
      ctx.ellipse(cx, cyMid, sonarR, sonarR * 0.78, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Halo incandescente rojo/naranja detrás del cuerpo de la mina para que destaque muchísimo
      ctx.fillStyle = `rgba(220, 38, 38, ${(0.42 * (1 - shutterClose)).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(cx, cyMid, mineR * 1.38, mineR * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. 8 Espoletas / Pinchos cónicos metálicos de contacto alrededor de la mina naval
      const numSpikes = 8;
      const rotAngle = currentTime * 0.0016 + (note._mineSeed || 0);
      for (let sp = 0; sp < numSpikes; sp++) {
        const a = rotAngle + (sp / numSpikes) * Math.PI * 2;
        const cosA = Math.cos(a);
        const sinA = Math.sin(a) * 0.82; // Escorzo 3D
        const baseR = mineR * 0.78;
        const tipR = mineR * 1.36;
        const perpX = -sinA * (mineR * 0.20);
        const perpY = cosA * (mineR * 0.20);

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(cx + cosA * baseR - perpX, cyMid + sinA * baseR - perpY);
        ctx.lineTo(cx + cosA * tipR, cyMid + sinA * tipR);
        ctx.lineTo(cx + cosA * baseR + perpX, cyMid + sinA * baseR + perpY);
        ctx.closePath();
        ctx.fill();

        // Punta roja detonadora en cada pincho
        ctx.fillStyle = pulse > 0.45 ? '#ff1e1e' : '#f97316';
        ctx.beginPath();
        ctx.arc(cx + cosA * tipR, cyMid + sinA * tipR, Math.max(1.5, mineR * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Esfera blindada de acero pesado de la mina + remaches (pre-renderizada en sprite offscreen con 0 coste por frame)
      if (!this._mineSphereSprite) {
        const mCan = document.createElement('canvas');
        mCan.width = 96;
        mCan.height = 96;
        const mCtx = mCan.getContext('2d');
        const mCx = 48, mCy = 48, mR = 40;
        const sphereGrad = mCtx.createRadialGradient(
          mCx - mR * 0.28, mCy - mR * 0.25, mR * 0.10,
          mCx, mCy, mR
        );
        sphereGrad.addColorStop(0.0, '#64748b');
        sphereGrad.addColorStop(0.45, '#1e293b');
        sphereGrad.addColorStop(0.85, '#090d16');
        sphereGrad.addColorStop(1.0, '#020408');

        mCtx.fillStyle = sphereGrad;
        mCtx.beginPath();
        mCtx.ellipse(mCx, mCy, mR, mR * 0.84, 0, 0, Math.PI * 2);
        mCtx.fill();

        mCtx.strokeStyle = '#94a3b8';
        mCtx.lineWidth = 2.6;
        mCtx.stroke();

        mCtx.fillStyle = '#e2e8f0';
        for (let rv = -2; rv <= 2; rv++) {
          const rx = mCx + rv * (mR * 0.34);
          const ry = mCy + Math.cos(rv * 0.6) * (mR * 0.12);
          mCtx.beginPath();
          mCtx.arc(rx, ry, 2.4, 0, Math.PI * 2);
          mCtx.fill();
        }
        this._mineSphereSprite = mCan;
      }
      const spSize = mineR * (96 / 40);
      ctx.drawImage(this._mineSphereSprite, cx - spSize * 0.5, cyMid - spSize * 0.5, spSize, spSize);

      // 5. Núcleo óptico LED armado (parpadeo de alta visibilidad rojo/amarillo)
      const isBlinkLit = Math.floor(currentTime * 0.012) % 2 === 0;
      const coreR = mineR * 0.44;
      ctx.fillStyle = isBlinkLit ? '#ff0022' : '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(cx, cyMid, coreR, coreR * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - coreR * 0.22, cyMid - coreR * 0.20, Math.max(1.2, coreR * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }

    // B. ANIMACIÓN DE COMPUERTAS BLINDADAS DE CAMUFLAJE + ESCÁNER LÁSER HOLOGRÁFICO (0.36 < pHead < 0.56)
    if (camoProgress > 0.0) {
      const topSpan = x1Top - x0Top;
      const botSpan = x1Bot - x0Bot;
      const halfClose = shutterClose * 0.5;

      // Compuerta izquierda deslizándose hacia el centro
      const lTopR = x0Top + topSpan * halfClose;
      const lBotR = x0Bot + botSpan * halfClose;
      ctx.fillStyle = '#1a1d28';
      ctx.beginPath();
      ctx.moveTo(x0Top, y0);
      ctx.lineTo(lTopR, y0);
      ctx.lineTo(lBotR, y1);
      ctx.lineTo(x0Bot, y1);
      ctx.closePath();
      ctx.fill();

      // Compuerta derecha deslizándose hacia el centro
      const rTopL = x1Top - topSpan * halfClose;
      const rBotL = x1Bot - botSpan * halfClose;
      ctx.beginPath();
      ctx.moveTo(rTopL, y0);
      ctx.lineTo(x1Top, y0);
      ctx.lineTo(x1Bot, y1);
      ctx.lineTo(rBotL, y1);
      ctx.closePath();
      ctx.fill();

      // Bordes de titanio y haz de escáner láser en la unión de las compuertas
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const seamAlpha = Math.sin(camoProgress * Math.PI);
      ctx.strokeStyle = `rgba(0, 242, 254, ${(seamAlpha * 0.95).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.8, 3.2 * scale);
      ctx.beginPath();
      ctx.moveTo(lTopR, y0);
      ctx.lineTo(lBotR, y1);
      ctx.moveTo(rTopL, y0);
      ctx.lineTo(rBotL, y1);
      ctx.stroke();

      // Materialización progresiva de la hendidura de luz blanca normal a medida que se cierra
      if (shutterClose > 0.35) {
        const slitReveal = (shutterClose - 0.35) / 0.65;
        const slitW = keyW * (nLanes === 4 ? 0.68 : 0.62) * slitReveal;
        const slitH = Math.max(4.5, 6.8 * scale);
        ctx.fillStyle = `rgba(255, 255, 255, ${(slitReveal * 0.95).toFixed(3)})`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - slitW * 0.5, cyMid - slitH * 0.5, slitW, slitH, slitH * 0.5);
        else ctx.rect(cx - slitW * 0.5, cyMid - slitH * 0.5, slitW, slitH);
        ctx.fill();
      }

      // Destello de bloqueo táctico cuando las compuertas hacen "CLACK" en el centro (camoProgress ~ 0.85..1.0)
      if (camoProgress > 0.72) {
        const lockFlash = Math.sin(((camoProgress - 0.72) / 0.28) * Math.PI);
        const fRad = (10 + (1 - lockFlash) * 16) * scale;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(lockFlash * 0.92).toFixed(3)})`;
        ctx.lineWidth = 2.0 * scale;
        ctx.beginPath();
        ctx.moveTo(cx, cyMid - fRad * 0.75);
        ctx.lineTo(cx + fRad, cyMid);
        ctx.lineTo(cx, cyMid + fRad * 0.75);
        ctx.lineTo(cx - fRad, cyMid);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
    return tapKey;
  }

  renderMinesweeperOverlay(ctx, currentTime) {
    if (!ctx) return;

    // 1. Renderizar fragmentos 3D de todas las teclas destruidas por la onda expansiva
    if (this._shatteredKeyFragments && this._shatteredKeyFragments.length > 0) {
      ctx.save();
      for (let i = 0; i < this._shatteredKeyFragments.length; i++) {
        const sh = this._shatteredKeyFragments[i];
        const p = Math.max(0, Math.min(1, sh.age / sh.duration));
        const alpha = Math.max(0, 1 - Math.pow(p, 1.6));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rot);
        const tiltScaleY = 0.35 + 0.65 * Math.abs(Math.cos(sh.rot * 1.7));
        ctx.scale(1.0, tiltScaleY);

        ctx.fillStyle = sh.bodyColor;
        ctx.strokeStyle = sh.rimColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-sh.w * 0.5, -sh.h * 0.4);
        ctx.lineTo(sh.w * 0.45, -sh.h * 0.5);
        ctx.lineTo(sh.w * 0.5, sh.h * 0.35);
        ctx.lineTo(-sh.w * 0.35, sh.h * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    // 2. Renderizar explosión volumétrica ultra-realista (Flash térmico + Ondas de Choque + Bola de Fuego + Humo + Metralla)
    if (this._mineExplosions && this._mineExplosions.length > 0) {
      for (let i = 0; i < this._mineExplosions.length; i++) {
        const exp = this._mineExplosions[i];
        const p = Math.max(0, Math.min(1, exp.age / exp.duration));
        const invP = 1 - p;

        ctx.save();

        // A. Flash térmico inicial en toda la pantalla y el epicentro (primeros 140ms)
        if (exp.age < 0.16) {
          const flashA = (1 - exp.age / 0.16) * 0.55;
          ctx.fillStyle = `rgba(255, 190, 90, ${flashA.toFixed(3)})`;
          ctx.fillRect(0, 0, this.width, this.height);
        }

        // B. Doble Onda de Choque Supersónica (Mach Shockwave Rings) en perspectiva
        const shockP1 = Math.min(1, exp.age / 0.52);
        if (shockP1 < 1) {
          const r1 = 24 + Math.pow(shockP1, 0.55) * Math.max(this.width, this.height) * 0.78;
          const a1 = (1 - shockP1) * 0.92;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = `rgba(255, 230, 140, ${a1.toFixed(3)})`;
          ctx.lineWidth = Math.max(2, (1 - shockP1) * 14);
          ctx.beginPath();
          ctx.ellipse(exp.x, exp.y, r1, r1 * 0.68, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255, 69, 0, ${(a1 * 0.75).toFixed(3)})`;
          ctx.lineWidth = Math.max(1.5, (1 - shockP1) * 24);
          ctx.beginPath();
          ctx.ellipse(exp.x, exp.y, r1 * 0.86, r1 * 0.58, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // C. Columnas de humo denso oscuro (debajo/alrededor del núcleo ígneo)
        for (let f = 0; f < exp.fireballs.length; f++) {
          const fb = exp.fireballs[f];
          if (exp.age < fb.delay) continue;
          const localP = Math.min(1, (exp.age - fb.delay) / (exp.duration - fb.delay));
          const curR = fb.r0 + (fb.rMax - fb.r0) * Math.pow(localP, 0.6);
          if (fb.isSmokePlume || localP > 0.35) {
            const smokeAlpha = fb.isSmokePlume
              ? Math.sin(localP * Math.PI) * 0.68
              : Math.max(0, (1 - localP) * 0.52);
            ctx.fillStyle = `rgba(24, 20, 18, ${smokeAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(fb.x, fb.y, curR * 1.12, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // D. Bola de Fuego Volumétrica Multi-Capa (Blanco incandescente -> Amarillo -> Naranja -> Carmesí)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let f = 0; f < exp.fireballs.length; f++) {
          const fb = exp.fireballs[f];
          if (fb.isSmokePlume || exp.age < fb.delay) continue;
          const localP = Math.min(1, (exp.age - fb.delay) / ((exp.duration * 0.72) - fb.delay));
          if (localP >= 1) continue;
          const curR = fb.r0 + (fb.rMax - fb.r0) * Math.pow(localP, 0.5);
          const fireA = Math.pow(1 - localP, 1.35) * 0.88;

          let col = '#ff4500';
          if (localP < 0.22) col = '#ffffff';
          else if (localP < 0.45) col = '#fde047';
          else if (localP < 0.72) col = '#ff5500';
          else col = '#dc2626';

          ctx.globalAlpha = fireA;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(fb.x, fb.y, curR, 0, Math.PI * 2);
          ctx.fill();
        }

        // E. Chispas balísticas de alta velocidad con estelas incandescentes
        ctx.globalAlpha = Math.max(0, invP);
        for (let s = 0; s < exp.sparks.length; s++) {
          const sp = exp.sparks[s];
          ctx.strokeStyle = sp.color;
          ctx.lineWidth = sp.size * invP;
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y);
          ctx.lineTo(sp.x - sp.vx * 0.032, sp.y - sp.vy * 0.032);
          ctx.stroke();
        }
        ctx.restore();

        ctx.restore();
      }
    }

    // 3. Renderizar textos flotantes de penalización de puntos por cada tecla explotada
    if (this._mineFloatingPenalties && this._mineFloatingPenalties.length > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < this._mineFloatingPenalties.length; i++) {
        const fp = this._mineFloatingPenalties[i];
        const p = Math.max(0, Math.min(1, fp.age / fp.duration));
        const alpha = p < 0.15 ? (p / 0.15) : Math.max(0, 1 - (p - 0.15) / 0.85);
        const popScale = (fp.scale || 1.0) * (p < 0.12 ? (0.7 + (p / 0.12) * 0.45) : 1.0);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(fp.x, fp.y);
        ctx.scale(popScale, popScale);
        ctx.font = fp.isHeadline
          ? '900 24px "Outfit", system-ui, sans-serif'
          : '900 18px "Outfit", system-ui, sans-serif';
        ctx.strokeStyle = fp.stroke || '#090202';
        ctx.lineWidth = fp.isHeadline ? 6.0 : 4.5;
        ctx.strokeText(fp.text, 0, 0);
        ctx.fillStyle = fp.color || '#ff3b30';
        ctx.fillText(fp.text, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // PSEUDO-3D CONICAL ENGINE (BEATSTAR PERSPECTIVE)
  // =========================================================================

  getPerspectiveCoord(lane, p, out = null) {
    // p: 0.0 at horizon, 1.0 at hit line (y = hitLineY)
    const nLanes = this.numLanes || 3;
    const isFour = (nLanes === 4);
    const curveExp = isFour ? 1.48 : 1.70;
    const minScale = isFour ? 0.64 : 0.50;
    const widthFactor = isFour ? 0.985 : 0.94;

    const pClamped = p < -0.25 ? -0.25 : (p > 1.4 ? 1.4 : p);
    const pCurved = pClamped >= 0 ? Math.pow(pClamped, curveExp) : -Math.pow(-pClamped, curveExp);
    const horizonY = this._perspHorizonY || 12;
    const spanY = this._perspSpanY || ((Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84)) - horizonY);
    const y = horizonY + spanY * pCurved;

    const baseLaneW = (this._perspBaseLaneW && this._perspCachedLanes === nLanes)
      ? this._perspBaseLaneW
      : ((this.width * widthFactor) / nLanes);
    const scale = minScale + (1.0 - minScale) * pCurved;
    const laneW = baseLaneW * scale;
    const midX = this._perspMidX || (this.width * 0.5);
    const x = midX + (lane - (nLanes - 1) * 0.5) * laneW;

    if (out) {
      out.x = x;
      out.y = y;
      out.scale = scale;
      out.laneW = laneW;
      out.pCurved = pCurved;
      return out;
    }
    return { x, y, scale, laneW, pCurved };
  }

  getLaneBoundaryX(lineIdx, yTarget) {
    const nLanes = this.numLanes || 3;
    const isFour = (nLanes === 4);
    const minScale = isFour ? 0.64 : 0.50;
    const widthFactor = isFour ? 0.985 : 0.94;
    const horizonY = this._perspHorizonY || 12;
    const invSpanY = this._perspInvSpanY || (1.0 / ((Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84)) - horizonY));
    const midX = this._perspMidX || (this.width * 0.5);
    const baseLaneW = (this._perspBaseLaneW && this._perspCachedLanes === nLanes)
      ? this._perspBaseLaneW
      : ((this.width * widthFactor) / nLanes);
    const t = (yTarget - horizonY) * invSpanY;
    const scale = minScale + (1.0 - minScale) * t;
    return midX + (lineIdx - nLanes * 0.5) * (baseLaneW * scale);
  }

  drawIvoryKey(ctx, laneOrCx, cy, h, scale = 1.0, isPressed = false, isLarge = true, isSwipe = false, lyricText = null, mirrorSide = null) {
    ctx.save();

    const nLanes = this.numLanes || 3;
    let lane = 0;
    if (typeof laneOrCx === 'number') {
      if (laneOrCx <= nLanes - 0.5) {
        lane = Math.max(0, Math.min(nLanes - 1, laneOrCx));
      } else {
        const laneW = this.width / nLanes;
        lane = Math.max(0, Math.min(nLanes - 1, Math.floor(laneOrCx / laneW)));
      }
    }

    const depressOffset = isPressed ? (3.5 * scale) : 0;
    const y = cy + depressOffset;
    const y0 = y - h / 2;
    const y1 = y0 + h;

    const margin = Math.max(1.8, (nLanes === 4 ? (isLarge ? 2.6 : 2.0) : (isLarge ? 5.0 : 3.5)) * scale);

    const x0Top = this.getLaneBoundaryX(lane, y0) + margin;
    const x1Top = this.getLaneBoundaryX(lane + 1, y0) - margin;
    const x0Bot = this.getLaneBoundaryX(lane, y1) + margin;
    const x1Bot = this.getLaneBoundaryX(lane + 1, y1) - margin;

    const r = Math.max(4, (nLanes === 4 ? (isLarge ? 8 : 5) : (isLarge ? 10 : 6)) * scale);

    const cx = (x0Top + x1Top + x0Bot + x1Bot) / 4;
    const cyMid = (y0 + y1) / 2;
    const keyW = x1Bot - x0Bot;
    const keyH = y1 - y0;
    const isMushKey = Boolean(this.isMushroomModeActive || (typeof window !== 'undefined' && window.isMushroomModeActive));

    // 1. Sombra suave bajo la tecla (sin bordes semitransparentes hacia los lados)
    ctx.fillStyle = isPressed ? 'rgba(0, 0, 0, 0.20)' : 'rgba(0, 0, 0, 0.35)';
    const shadowOff = (isLarge ? 4.5 : 2.5) * scale;
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0 + shadowOff, y1 + shadowOff, r);
    ctx.fill();

    // 2. Cara Frontal en grosor 3D (Cian profundo o Rosa magenta profundo en Modo Espejo)
    const bevelH = Math.max(3, (isLarge ? 9 : 5) * scale);
    const yBevelTop = y1 - bevelH;
    const x0Bev = this.getLaneBoundaryX(lane, yBevelTop) + margin;
    const x1Bev = this.getLaneBoundaryX(lane + 1, yBevelTop) - margin;

    const isTranscendentKey = !mirrorSide && !isMushKey && (this.activeEffect === 'astral_transcendence');

    if (mirrorSide === 'cyan') {
      ctx.fillStyle = isPressed ? '#0284c7' : '#075985';
    } else if (mirrorSide === 'pink') {
      ctx.fillStyle = isPressed ? '#be185d' : '#831843';
    } else if (mirrorSide === 'echo_source') {
      ctx.fillStyle = isPressed ? '#047857' : '#064e3b';
    } else if (mirrorSide === 'echo_rebound') {
      ctx.fillStyle = isPressed ? '#0369a1' : '#0f766e';
    } else if (isTranscendentKey) {
      ctx.fillStyle = isPressed ? '#0284c7' : (lane === 1 ? '#3b0764' : '#1e1b4b');
    } else {
      ctx.fillStyle = isPressed ? '#22222a' : (isMushKey ? '#230b36' : '#141419');
    }
    tracePerspectiveQuad(ctx, x0Bev, x1Bev, x0Bot, x1Bot, yBevelTop, y1, r);
    ctx.fill();

    // 3. Cara Superior en acabado pulido 3D (Cian eléctrico, Rosa neón, Esmeralda ECO o Reliquia Astral Trascendental)
    if (mirrorSide === 'cyan') {
      ctx.fillStyle = isPressed ? '#38bdf8' : '#0891b2';
    } else if (mirrorSide === 'pink') {
      ctx.fillStyle = isPressed ? '#f472b6' : '#db2777';
    } else if (mirrorSide === 'echo_source') {
      ctx.fillStyle = isPressed ? '#34d399' : '#0d9488';
    } else if (mirrorSide === 'echo_rebound') {
      ctx.fillStyle = isPressed ? '#67e8f9' : '#10b981';
    } else if (isTranscendentKey) {
      ctx.fillStyle = isPressed ? '#38bdf8' : '#130926';
    } else {
      ctx.fillStyle = isPressed ? '#45e69e' : (isMushKey ? '#2d124d' : '#1a1d28');
    }
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bev, x1Bev, y0, yBevelTop, r);
    ctx.fill();

    // 4. Borde metálico nítido (Con iridiscencia Oro/Cian/Magenta en modo Trascendental)
    ctx.save();
    const mushRimColors = ['#ff00ff', '#00ff88', '#00f2fe', '#ffee00'];
    const transRimColors = ['#00f2fe', '#fde047', '#ff007f'];
    const rimCol = mirrorSide === 'cyan'
      ? '#67e8f9'
      : (mirrorSide === 'pink'
        ? '#f9a8d4'
        : (mirrorSide === 'echo_source'
          ? '#5eead4'
          : (mirrorSide === 'echo_rebound'
            ? '#a7f3d0'
            : (isTranscendentKey
              ? transRimColors[lane % 3]
              : (isMushKey ? mushRimColors[Math.floor((cy * 0.03 + (this._frameNow || 0) * 0.006)) & 3] : '#3e4252')))));
    ctx.strokeStyle = isPressed ? '#ffffff' : rimCol;
    ctx.lineWidth = Math.max(1.2, (isPressed || mirrorSide || isTranscendentKey ? 2.3 : (isMushKey ? 2.1 : 1.4)) * scale);
    tracePerspectiveQuad(ctx, x0Top, x1Top, x0Bot, x1Bot, y0, y1, r);
    ctx.stroke();

    // Filigrana interior dorada exclusiva para teclas Trascendentales
    if (isTranscendentKey && isLarge) {
      const inPad = 3.2 * scale;
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.52)';
      ctx.lineWidth = Math.max(0.9, 1.2 * scale);
      tracePerspectiveQuad(ctx, x0Top + inPad, x1Top - inPad, x0Bev + inPad, x1Bev - inPad, y0 + inPad * 0.7, yBevelTop - inPad * 0.7, Math.max(2, r - 2));
      ctx.stroke();
    }

    // Destello de bisel reflectante superior
    ctx.strokeStyle = isTranscendentKey ? 'rgba(253, 224, 71, 0.75)' : 'rgba(255, 255, 255, 0.40)';
    ctx.lineWidth = Math.max(0.8, 1.1 * scale);
    ctx.beginPath();
    ctx.moveTo(x0Top + r, y0 + 0.8);
    ctx.lineTo(x1Top - r, y0 + 0.8);
    ctx.stroke();
    ctx.restore();

    // ===========================================================================
    // 5. Hendidura de Luz Central incandescente, Reliquia Astral O Palabra Grabada
    // ===========================================================================
    if (!isSwipe) {
      if (lyricText) {
        const sp = this._getLyricKeySprite(lyricText, isPressed);
        const drawW = Math.min(keyW * 0.94, 132 * scale);
        const drawH = 42 * (drawW / 132);
        if (isMushKey && (this._mushFlipProgress || 0) > 0.5) {
          ctx.save();
          ctx.translate(cx, cyMid);
          ctx.scale(1, -1);
          ctx.drawImage(sp, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
          ctx.restore();
        } else {
          ctx.drawImage(sp, cx - drawW * 0.5, cyMid - drawH * 0.5, drawW, drawH);
        }
      } else if (isTranscendentKey) {
        // Emblema de Serafín & Astrolabio Prismático pre-renderizado en offscreen canvas (1 sola llamada drawImage = 120 FPS!)
        if (!this._transcendentKeyCoreSprite) {
          const tCan = document.createElement('canvas');
          tCan.width = 160;
          tCan.height = 56;
          const tCtx = tCan.getContext('2d');
          const midX = 80, midY = 28;
          tCtx.globalCompositeOperation = 'lighter';

          // Halo prismático cian-magenta-oro
          const g = tCtx.createLinearGradient(16, midY, 144, midY);
          g.addColorStop(0.0, 'rgba(0, 242, 254, 0)');
          g.addColorStop(0.2, 'rgba(0, 242, 254, 0.78)');
          g.addColorStop(0.5, 'rgba(253, 224, 71, 0.95)');
          g.addColorStop(0.8, 'rgba(255, 0, 127, 0.78)');
          g.addColorStop(1.0, 'rgba(255, 0, 127, 0)');
          tCtx.fillStyle = g;
          tCtx.beginPath();
          if (tCtx.roundRect) tCtx.roundRect(16, midY - 6, 128, 12, 6);
          else tCtx.rect(16, midY - 6, 128, 12);
          tCtx.fill();

          // Filamento central blanco puro
          tCtx.fillStyle = '#ffffff';
          tCtx.beginPath();
          if (tCtx.roundRect) tCtx.roundRect(28, midY - 2.5, 104, 5, 2.5);
          else tCtx.rect(28, midY - 2.5, 104, 5);
          tCtx.fill();

          // Anillo de astrolabio dorado central y diamante sagrado
          tCtx.strokeStyle = '#fde047';
          tCtx.lineWidth = 2.0;
          tCtx.beginPath();
          tCtx.ellipse(midX, midY, 18, 11, 0, 0, Math.PI * 2);
          tCtx.stroke();

          tCtx.fillStyle = '#ffffff';
          tCtx.beginPath();
          tCtx.moveTo(midX, midY - 9);
          tCtx.lineTo(midX + 11, midY);
          tCtx.lineTo(midX, midY + 9);
          tCtx.lineTo(midX - 11, midY);
          tCtx.closePath();
          tCtx.fill();

          // Dos gemas laterales cian
          tCtx.fillStyle = '#00f2fe';
          tCtx.beginPath();
          tCtx.arc(midX - 34, midY, 3.2, 0, Math.PI * 2);
          tCtx.arc(midX + 34, midY, 3.2, 0, Math.PI * 2);
          tCtx.fill();

          this._transcendentKeyCoreSprite = tCan;
        }
        const slitW = keyW * (nLanes === 4 ? 0.74 : 0.70);
        const drawW = slitW * (160 / 116);
        const drawH = Math.max(14, 26 * scale);
        ctx.drawImage(this._transcendentKeyCoreSprite, cx - drawW * 0.5, cyMid - drawH * 0.5, drawW, drawH);
      } else {
        // Hendidura blanca neón pura pre-renderizada en sprite offscreen (1 sola llamada drawImage en lugar de 4 roundRect + lighter por tecla)
        if (!this._keyNeonSlitSprite) {
          const sCan = document.createElement('canvas');
          sCan.width = 160;
          sCan.height = 48;
          const sCtx = sCan.getContext('2d');
          const bW = 112, bH = 12;
          const bX = (160 - bW) * 0.5;
          const bY = (48 - bH) * 0.5;
          sCtx.globalCompositeOperation = 'lighter';

          const drawLayer = (spX, spY, alpha) => {
            sCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            sCtx.beginPath();
            const w = bW + spX * 2;
            const h = bH + spY * 2;
            if (sCtx.roundRect) sCtx.roundRect(bX - spX, bY - spY, w, h, h * 0.5);
            else sCtx.rect(bX - spX, bY - spY, w, h);
            sCtx.fill();
          };
          drawLayer(20, 15, 0.16);
          drawLayer(9.6, 7.4, 0.42);
          drawLayer(4.2, 3.2, 0.78);
          drawLayer(0, 0, 1.0);
          this._keyNeonSlitSprite = sCan;
        }
        const slitW = keyW * (nLanes === 4 ? 0.68 : 0.62);
        const slitH = Math.max(4.5, 6.8 * scale);
        const drawW = slitW * (160 / 112);
        const drawH = slitH * (48 / 12);
        ctx.drawImage(this._keyNeonSlitSprite, cx - drawW * 0.5, cyMid - drawH * 0.5, drawW, drawH);
      }
    }

    ctx.restore();
    if (!this._keyRectScratch) {
      this._keyRectScratch = { cx: 0, cy: 0, w: 0, h: 0 };
    }
    this._keyRectScratch.cx = cx;
    this._keyRectScratch.cy = cyMid;
    this._keyRectScratch.w = keyW;
    this._keyRectScratch.h = keyH;
    return this._keyRectScratch;
  }

  // Tecla Neón 2D Clásica (para modo 2D Neón)
  draw2DNeonKey(ctx, cx, cy, w, h, isPressed = false, isLarge = true, lyricText = null) {
    ctx.save();
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    const r = isLarge ? 8 : 5;

    ctx.shadowBlur = 0;

    const grad = ctx.createLinearGradient(0, y0, 0, y0 + h);
    if (isPressed) {
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.3, '#ff007f');
      grad.addColorStop(0.8, '#aa0055');
      grad.addColorStop(1.0, '#550022');
    } else {
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.15, '#e0fcff');
      grad.addColorStop(0.5, '#00d2fe');
      grad.addColorStop(0.85, '#005588');
      grad.addColorStop(1.0, '#002244');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, y0, w, h, r);
    else ctx.rect(x0, y0, w, h);
    ctx.fill();

    ctx.strokeStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = isLarge ? 2.2 : 1.4;
    ctx.stroke();

    if (lyricText) {
      const sp = this._getLyricKeySprite(lyricText, isPressed);
      const drawW = Math.min(w * 0.94, 124);
      const drawH = 42 * (drawW / 132);
      ctx.drawImage(sp, cx - drawW * 0.5, cy - drawH * 0.5, drawW, drawH);
    } else if (isLarge) {
      // Línea de energía central blanco neón brillante para teclas grandes en 2D (0 shadowBlur GPU)
      const slitW = w * 0.62;
      const slitH = 6.0;
      const slitX = cx - slitW / 2;
      const slitY = cy - slitH / 2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(slitX - 7, slitY - 5, slitW + 14, slitH + 10, (slitH + 10) / 2);
      else ctx.rect(slitX - 7, slitY - 5, slitW + 14, slitH + 10);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(slitX - 3, slitY - 2.5, slitW + 6, slitH + 5, (slitH + 5) / 2);
      else ctx.rect(slitX - 3, slitY - 2.5, slitW + 6, slitH + 5);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(slitX, slitY, slitW, slitH, slitH / 2);
      else ctx.rect(slitX, slitY, slitW, slitH);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  renderLanes(currentTime = null) {
    const ctx = this.ctx;
    const cTime = Number.isFinite(currentTime) ? currentTime : (this.getCurrentGameTimeMs() || 0);
    const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
    const horizonY = 12;
    const bottomY = this.height + 30;
    const midX = this.width / 2;
    const is3D = (this.visualDimension !== '2d');

    // Cálculo exacto del pulso Beatstar sincronizado al BPM de la canción
    const songBpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : 128;
    let normBpm = songBpm;
    while (normBpm > 175) normBpm /= 2;
    while (normBpm < 75) normBpm *= 2;
    const beatInterval = 60 / normBpm;
    const safePerfNow = this._frameNow || performance.now();
    const audioTime = (cTime >= 0 ? cTime : safePerfNow) / 1000;
    const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
    const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.8); // Pico en el bombo

    // Multiplicador activo y color temático
    const mult = this.multiplier || 1;
    const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
    let railLaserCol = palette ? (palette.primary || '#00f5a0') : '#00f5a0';
    let railGlowCol = palette ? (palette.glow || '#00f5a0') : '#00f5a0';

    if (mult === 2) {
      railLaserCol = '#ffd700'; // Dorado 2x
      railGlowCol = '#ffaa00';
    } else if (mult === 3) {
      railLaserCol = '#ff007f'; // Magenta Neón 3x
      railGlowCol = '#d946ef';
    } else if (mult === 4) {
      railLaserCol = '#00d4ff'; // Cian Eléctrico 4x
      railGlowCol = '#38bdf8';
    } else if (mult >= 5) {
      railLaserCol = '#a855f7'; // Púrpura Imperial / Oro 5x (sin blanco cegador)
      railGlowCol = '#ffd700';
    }

    // Actualizar portal del artista al compás del BPM con filtro de umbral para no tocar el DOM 120 veces/seg
    if (!this.hudArtistPortalEl) this.hudArtistPortalEl = document.getElementById('hudArtistPortal');
    if (this.hudArtistPortalEl && Math.abs(beatPulse - (this._lastPortalPulse || 0)) > 0.018) {
      this._lastPortalPulse = beatPulse;
      this.hudArtistPortalEl.style.transform = `scale(${(1 + beatPulse * 0.12).toFixed(3)})`;
    }

    ctx.save();

    const nLanes = this.numLanes || 3;
    if (is3D) {
      const getBoundaryX = (lineIdx, yTarget) => this.getLaneBoundaryX(lineIdx, yTarget);

      // 1. AUTOPISTA 3D BLANCA NACARADA DE ALTA GAMA CON VOLUMEN CILÍNDRICO Y SOMBRA DIFUMINADA EN EL HORIZONTE
      const tL_top = getBoundaryX(0, horizonY);
      const tR_top = getBoundaryX(nLanes, horizonY);
      const tR_bot = getBoundaryX(nLanes, bottomY);
      const tL_bot = getBoundaryX(0, bottomY);

      // A1. Superficie principal con degradado nacarado 3D (o autopista psicodélica en Modo Setas / asfalto en Modo Carretera / agua cristalina en Modo Río Rápido)
      const isMushTrack = Boolean(this.isMushroomModeActive || (typeof window !== 'undefined' && window.isMushroomModeActive));
      const isHighwayTrack = Boolean(this.isHighwayModeActive || (typeof window !== 'undefined' && window.isHighwayModeActive));
      const isRiverTrack = Boolean(this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive));
      if (isMushTrack && (!this._mushTrackGrad || this._mushTrackGradH !== bottomY)) {
        this._mushTrackGradH = bottomY;
        const mg = ctx.createLinearGradient(this.width / 2, horizonY, this.width / 2, bottomY);
        mg.addColorStop(0.00, '#120324');
        mg.addColorStop(0.25, '#2b0952');
        mg.addColorStop(0.55, '#431278');
        mg.addColorStop(0.82, '#5e179e');
        mg.addColorStop(1.00, '#380b66');
        this._mushTrackGrad = mg;
      }
      if (isHighwayTrack && (!this._hwTrackGrad || this._hwTrackGradH !== bottomY)) {
        this._hwTrackGradH = bottomY;
        const hg = ctx.createLinearGradient(this.width / 2, horizonY, this.width / 2, bottomY);
        hg.addColorStop(0.00, '#090d16');
        hg.addColorStop(0.28, '#111827');
        hg.addColorStop(0.65, '#1e293b');
        hg.addColorStop(1.00, '#0f172a');
        this._hwTrackGrad = hg;
      }
      if (isRiverTrack && (!this._riverTrackGrad || this._riverTrackGradH !== bottomY)) {
        this._riverTrackGradH = bottomY;
        const rg = ctx.createLinearGradient(this.width / 2, horizonY, this.width / 2, bottomY);
        rg.addColorStop(0.00, '#021324');
        rg.addColorStop(0.18, '#04385c');
        rg.addColorStop(0.45, '#0369a1');
        rg.addColorStop(0.75, '#0891b2');
        rg.addColorStop(0.92, '#06b6d4');
        rg.addColorStop(1.00, '#0e7490');
        this._riverTrackGrad = rg;
      }
      ctx.beginPath();
      ctx.moveTo(tL_top, horizonY);
      ctx.lineTo(tR_top, horizonY);
      ctx.lineTo(tR_bot, bottomY);
      ctx.lineTo(tL_bot, bottomY);
      ctx.closePath();
      ctx.fillStyle = isRiverTrack
        ? (this._riverTrackGrad || '#0284c7')
        : (isHighwayTrack
            ? (this._hwTrackGrad || '#1e293b')
            : (isMushTrack ? (this._mushTrackGrad || '#2b0952') : (this._trackGrad || '#f8fafc')));
      ctx.fill();

      // A2. Sombreado cilíndrico 3D de bordes y brillo central perlado
      if (this._trackEdgeShadowGrad && !isHighwayTrack && !isRiverTrack) {
        ctx.fillStyle = this._trackEdgeShadowGrad;
        ctx.fill();
      }

      // A3. Lomo especular 3D en el centro de cada uno de los carriles
      ctx.fillStyle = isRiverTrack
        ? 'rgba(125, 211, 252, 0.16)'
        : (isHighwayTrack ? 'rgba(255, 255, 255, 0.045)' : 'rgba(255, 255, 255, 0.38)');
      ctx.beginPath();
      for (let l = 0; l < nLanes; l++) {
        const cTopL = getBoundaryX(l + 0.28, horizonY);
        const cTopR = getBoundaryX(l + 0.72, horizonY);
        const cBotR = getBoundaryX(l + 0.72, bottomY);
        const cBotL = getBoundaryX(l + 0.28, bottomY);
        ctx.moveTo(cTopL, horizonY);
        ctx.lineTo(cTopR, horizonY);
        ctx.lineTo(cBotR, bottomY);
        ctx.lineTo(cBotL, bottomY);
        ctx.closePath();
      }
      ctx.fill();

      // En Modo Río: Agua realista multicapa, cáusticas solares, pequeñas olitas reactivas a la velocidad, focas ultra realistas y riberas rocosas
      if (isRiverTrack) {
        if (!this._riverAssetsReady) {
          this.initRiverModeAssets();
          this._prepareRiverChoreography();
        }
        const activeTimeMs = cTime >= 0 ? cTime : safePerfNow;
        const riverFlowPos = this._getRiverFlowPos(activeTimeMs);
        // Usar fase continua sin recortar antes de multiplicar para evitar saltos de módulo al acelerar
        const riverFlowPhase = Math.max(0, riverFlowPos * 0.00105);
        const riverScroll = riverFlowPhase % 1.0;
        const curSpeed = this._getRiverSpeedMult(activeTimeMs);
        const speedExcite = Math.max(0, Math.min(1.6, (curSpeed - 0.72) / 0.85));
        const stepDt = Math.min(0.033, Math.max(0.004, this._frameDt || 0.016));

        // 0. Sombras profundas de las orillas sumergidas y lecho de cantos rodados subacuáticos
        ctx.fillStyle = 'rgba(2, 18, 34, 0.38)';
        ctx.beginPath();
        ctx.moveTo(tL_top, horizonY);
        ctx.lineTo(getBoundaryX(0.24, horizonY), horizonY);
        ctx.lineTo(getBoundaryX(0.24, bottomY), bottomY);
        ctx.lineTo(tL_bot, bottomY);
        ctx.closePath();
        ctx.moveTo(getBoundaryX(2.76, horizonY), horizonY);
        ctx.lineTo(tR_top, horizonY);
        ctx.lineTo(tR_bot, bottomY);
        ctx.lineTo(getBoundaryX(2.76, bottomY), bottomY);
        ctx.closePath();
        ctx.fill();

        // 0B. Malla de refracción solar (cáusticas cristalinas animadas sobre el fondo del río)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const causticBands = 14;
        for (let cb = 0; cb < causticBands; cb++) {
          const u0 = ((cb / causticBands) + riverFlowPhase * 0.82) % 1.0;
          const p0 = Math.pow(u0, 1.7);
          const cy = horizonY + (bottomY - horizonY) * p0;
          const cAlpha = Math.sin(u0 * Math.PI) * (0.09 + speedExcite * 0.05);
          if (cAlpha <= 0.01) continue;
          const lx = getBoundaryX(0.15, cy);
          const rx = getBoundaryX(2.85, cy);
          const wSpan = rx - lx;
          const waveY = (3 + 7 * p0) * Math.sin(activeTimeMs * 0.0045 + cb * 1.7);
          ctx.strokeStyle = `rgba(165, 243, 252, ${cAlpha.toFixed(3)})`;
          ctx.lineWidth = 1.4 + 3.0 * p0;
          ctx.beginPath();
          ctx.moveTo(lx, cy);
          ctx.bezierCurveTo(
            lx + wSpan * 0.33, cy + waveY,
            lx + wSpan * 0.66, cy - waveY,
            rx, cy + waveY * 0.4
          );
          ctx.stroke();
        }
        ctx.restore();

        // 1. Peces Koi nadando suavemente bajo la superficie translúcida del río
        if (this._riverSwimmingKoi && this._riverKoiSprites && this._riverKoiSprites.length > 0) {
          for (let k = 0; k < this._riverSwimmingKoi.length; k++) {
            const koi = this._riverSwimmingKoi[k];
            koi.lane += koi.vx * stepDt * curSpeed;
            koi.p += koi.vp * stepDt * curSpeed;
            if (koi.lane < 0.18 || koi.lane > 1.82) koi.vx = -koi.vx;
            if (koi.p < 0.14 || koi.p > 0.88) koi.vp = -koi.vp;
            const kCoord = this.getPerspectiveCoord(koi.lane, koi.p, this._coordScratch1);
            const kw = 46 * kCoord.scale;
            const kh = 30 * kCoord.scale;
            const ang = Math.atan2(koi.vp * 1.4, koi.vx) + Math.sin(activeTimeMs * 0.009 + koi.phase) * 0.14;
            ctx.save();
            ctx.globalAlpha = 0.48;
            ctx.translate(kCoord.x, kCoord.y);
            ctx.rotate(ang);
            ctx.drawImage(this._riverKoiSprites[koi.variant % this._riverKoiSprites.length], -kw * 0.5, -kh * 0.5, kw, kh);
            ctx.restore();
          }
        }

        // 1B. Focas Ultra Realistas nadando ágilmente por el cauce y dejando estelas de espuma en V
        if (this._riverSwimmingSeals && this._riverSealSprites && this._riverSealSprites.length > 0) {
          for (let sIdx = 0; sIdx < this._riverSwimmingSeals.length; sIdx++) {
            const seal = this._riverSwimmingSeals[sIdx];
            seal.lane += seal.vx * stepDt * (0.85 + curSpeed * 0.35);
            seal.p += seal.vp * stepDt * (0.85 + curSpeed * 0.35);
            if (seal.lane < 0.22) { seal.lane = 0.22; seal.vx = Math.abs(seal.vx); }
            if (seal.lane > 1.78) { seal.lane = 1.78; seal.vx = -Math.abs(seal.vx); }
            if (seal.p < 0.18) { seal.p = 0.18; seal.vp = Math.abs(seal.vp); }
            if (seal.p > 0.84) { seal.p = 0.84; seal.vp = -Math.abs(seal.vp); }

            const sCoord = this.getPerspectiveCoord(seal.lane, seal.p, this._coordScratch1);
            const sw = 88 * sCoord.scale;
            const sh = 55 * sCoord.scale;
            const swimWiggle = Math.sin(activeTimeMs * 0.0085 + seal.phase) * 0.11;
            const sAng = Math.atan2(seal.vp * 1.35, seal.vx) + swimWiggle;

            ctx.save();
            ctx.translate(sCoord.x, sCoord.y);
            ctx.rotate(sAng);

            // Estela hidrodinámica en V y anillos de agua alrededor de la foca
            ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
            ctx.lineWidth = Math.max(1.2, 2.0 * sCoord.scale);
            ctx.beginPath();
            ctx.moveTo(sw * 0.36, 0);
            ctx.quadraticCurveTo(0, -sh * 0.44, -sw * 0.58, -sh * (0.56 + 0.08 * Math.sin(activeTimeMs * 0.01 + sIdx)));
            ctx.moveTo(sw * 0.36, 0);
            ctx.quadraticCurveTo(0, sh * 0.44, -sw * 0.58, sh * (0.56 + 0.08 * Math.cos(activeTimeMs * 0.01 + sIdx)));
            ctx.stroke();

            ctx.globalAlpha = 0.92;
            ctx.drawImage(this._riverSealSprites[seal.variant % this._riverSealSprites.length], -sw * 0.5, -sh * 0.5, sw, sh);
            ctx.restore();
          }
        }

        // 2. Pequeñas Olitas 3D Reactivas a la Velocidad (Denominador fijo constante MAX_WAVELETS para que jamás den tirones al acelerar)
        const MAX_WAVELETS = 28;
        ctx.lineCap = 'round';
        for (let wIdx = 0; wIdx < MAX_WAVELETS; wIdx++) {
          // Las olitas extra (wIdx >= 18) aparecen con fundido suave según la velocidad sin alterar la fase de las demás
          const extraVisibility = wIdx < 18 ? 1.0 : Math.max(0, Math.min(1.0, (speedExcite * 10.5) - (wIdx - 18)));
          if (extraVisibility <= 0.02) continue;

          const u0 = ((wIdx / MAX_WAVELETS) + riverFlowPhase * (1.0 + (wIdx % 3) * 0.14)) % 1.0;
          if (u0 < 0.04 || u0 > 0.97) continue;
          const p0 = Math.pow(u0, 1.7);
          const wy = horizonY + (bottomY - horizonY) * p0;
          const lanePos = 0.18 + ((wIdx * 0.754877) % 2.64);
          const lateralOsc = Math.sin(activeTimeMs * 0.0038 + wIdx * 1.9) * 0.08;
          const wx = getBoundaryX(lanePos + lateralOsc, wy);

          const waveScale = (0.35 + 0.65 * p0) * (0.82 + speedExcite * 0.48);
          const waveHalfW = (14 + (wIdx % 4) * 5.5) * waveScale;
          const waveCrestH = (3.5 + (wIdx % 3) * 1.8 + speedExcite * 3.2) * waveScale;
          const waveAlpha = Math.min(0.88, (0.28 + speedExcite * 0.38) * Math.sin(u0 * Math.PI) * extraVisibility);

          // Seno oscuro bajo la cresta de la olita (volumen 3D líquido)
          ctx.strokeStyle = `rgba(3, 36, 62, ${(waveAlpha * 0.65).toFixed(3)})`;
          ctx.lineWidth = Math.max(1.2, 2.8 * waveScale);
          ctx.beginPath();
          ctx.moveTo(wx - waveHalfW * 0.92, wy + waveCrestH * 0.55);
          ctx.quadraticCurveTo(wx, wy - waveCrestH * 0.45, wx + waveHalfW * 0.92, wy + waveCrestH * 0.55);
          ctx.stroke();

          // Cuerpo turquesa cristalino de la olita
          ctx.strokeStyle = `rgba(125, 211, 252, ${(waveAlpha * 0.85).toFixed(3)})`;
          ctx.lineWidth = Math.max(1.2, 2.4 * waveScale);
          ctx.beginPath();
          ctx.moveTo(wx - waveHalfW, wy + waveCrestH * 0.25);
          ctx.quadraticCurveTo(wx, wy - waveCrestH, wx + waveHalfW, wy + waveCrestH * 0.25);
          ctx.stroke();

          // Cresta de espuma blanca rizada en la cima de la olita (Whitecap)
          ctx.strokeStyle = `rgba(255, 255, 255, ${(waveAlpha * (0.72 + speedExcite * 0.25)).toFixed(3)})`;
          ctx.lineWidth = Math.max(1.0, 1.6 * waveScale);
          ctx.beginPath();
          ctx.moveTo(wx - waveHalfW * 0.68, wy - waveCrestH * 0.12);
          ctx.quadraticCurveTo(wx, wy - waveCrestH * 1.05, wx + waveHalfW * 0.68, wy - waveCrestH * 0.12);
          ctx.stroke();
        }

        // 2B. Líneas de corriente rápida y burbujas de oxígeno arrastradas por el caudal
        const numStreaks = 16;
        for (let sIdx = 0; sIdx < numStreaks; sIdx++) {
          const u0 = ((sIdx / numStreaks) + riverFlowPhase * 1.25) % 1.0;
          const u1 = Math.min(1.0, u0 + (0.040 + 0.032 * Math.min(1.6, curSpeed)));
          if (u1 <= u0 + 0.005) continue;
          const p0 = Math.pow(u0, 1.7);
          const p1 = Math.pow(u1, 1.7);
          const y0 = horizonY + (bottomY - horizonY) * p0;
          const y1 = horizonY + (bottomY - horizonY) * p1;
          const laneFrac = ((sIdx * 0.618) % 2.6) + 0.2;
          const sway = Math.sin(u0 * 12.0 + activeTimeMs * 0.004 + sIdx) * 0.05;
          const x0 = getBoundaryX(laneFrac + sway, y0);
          const x1 = getBoundaryX(laneFrac - sway, y1);

          const streakAlpha = Math.min(0.65, (0.16 + speedExcite * 0.30) * Math.sin(u0 * Math.PI));
          ctx.strokeStyle = (sIdx % 2 === 0)
            ? `rgba(240, 249, 255, ${streakAlpha.toFixed(2)})`
            : `rgba(165, 243, 252, ${(streakAlpha * 0.85).toFixed(2)})`;
          ctx.lineWidth = Math.max(1.0, (1.3 + 2.2 * p0) * (1.0 + speedExcite * 0.25));
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }

        // 3. Corrientes divisorias ondulantes de espuma viva entre los 3 carriles
        for (let l = 1; l <= 2; l++) {
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.36)';
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          const steps = 20;
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const p = Math.pow(u, 1.7);
            const ry = horizonY + (bottomY - horizonY) * p;
            const rippleX = Math.sin(u * 14.0 - riverFlowPhase * Math.PI * 4 + l * 2.1) * ((2.8 + speedExcite * 2.2) * p);
            const rx = getBoundaryX(l, ry) + rippleX;
            if (s === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
      } else if (isHighwayTrack) {
        const roadScroll = ((cTime >= 0 ? cTime : safePerfNow) * 0.0014) % 1.0;
        const kerbSegs = 18;
        for (let k = 0; k < kerbSegs; k++) {
          const u0 = (k / kerbSegs + roadScroll) % 1.0;
          const u1 = Math.min(1.0, u0 + (1.0 / kerbSegs));
          if (u1 <= u0) continue;
          const p0 = Math.pow(u0, 1.7);
          const p1 = Math.pow(u1, 1.7);
          const y0 = horizonY + (bottomY - horizonY) * p0;
          const y1 = horizonY + (bottomY - horizonY) * p1;
          ctx.fillStyle = (k % 2 === 0) ? '#ef4444' : '#f8fafc';

          // Piano izquierdo
          ctx.beginPath();
          ctx.moveTo(getBoundaryX(0, y0), y0);
          ctx.lineTo(getBoundaryX(0.11, y0), y0);
          ctx.lineTo(getBoundaryX(0.11, y1), y1);
          ctx.lineTo(getBoundaryX(0, y1), y1);
          ctx.closePath();
          ctx.fill();

          // Piano derecho
          ctx.beginPath();
          ctx.moveTo(getBoundaryX(2.89, y0), y0);
          ctx.lineTo(getBoundaryX(3, y0), y0);
          ctx.lineTo(getBoundaryX(3, y1), y1);
          ctx.lineTo(getBoundaryX(2.89, y1), y1);
          ctx.closePath();
          ctx.fill();
        }

        // Líneas discontinuas blancas de autopista dividiendo los 3 carriles con escorzo 3D
        const dashCount = 11;
        ctx.fillStyle = '#f8fafc';
        for (let d = 0; d < dashCount; d++) {
          const uStart = ((d / dashCount) + roadScroll) % 1.0;
          const uEnd = Math.min(1.0, uStart + (0.48 / dashCount));
          if (uEnd <= uStart + 0.005) continue;
          const p0 = Math.pow(uStart, 1.7);
          const p1 = Math.pow(uEnd, 1.7);
          const y0 = horizonY + (bottomY - horizonY) * p0;
          const y1 = horizonY + (bottomY - horizonY) * p1;
          const w0 = 1.2 + 2.8 * p0;
          const w1 = 1.2 + 2.8 * p1;

          for (let l = 1; l <= 2; l++) {
            const x0 = getBoundaryX(l, y0);
            const x1 = getBoundaryX(l, y1);
            ctx.beginPath();
            ctx.moveTo(x0 - w0, y0);
            ctx.lineTo(x0 + w0, y0);
            ctx.lineTo(x1 + w1, y1);
            ctx.lineTo(x1 - w1, y1);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else {
        // A4. Oclusión ambiental interna a lo largo de los bordes laterales en perspectiva 3D
        ctx.fillStyle = 'rgba(30, 41, 59, 0.16)';
        ctx.beginPath();
        // Borde interior izquierdo
        ctx.moveTo(tL_top, horizonY);
        ctx.lineTo(getBoundaryX(0.14, horizonY), horizonY);
        ctx.lineTo(getBoundaryX(0.14, bottomY), bottomY);
        ctx.lineTo(tL_bot, bottomY);
        ctx.closePath();
        // Borde interior derecho
        ctx.moveTo(getBoundaryX(nLanes - 0.14, horizonY), horizonY);
        ctx.lineTo(tR_top, horizonY);
        ctx.lineTo(tR_bot, bottomY);
        ctx.lineTo(getBoundaryX(nLanes - 0.14, bottomY), bottomY);
        ctx.closePath();
        ctx.fill();

        // B. Líneas de compás en perspectiva 3D (se desvanecen suavemente hacia el horizonte)
        const numRungs = 20;
        for (let r = 2; r < numRungs; r++) {
          const p = Math.pow(r / numRungs, 2.25);
          const ry = horizonY + (bottomY - horizonY) * p;
          const rungAlpha = Math.min(0.16, p * 0.18);
          ctx.strokeStyle = `rgba(71, 85, 105, ${rungAlpha.toFixed(3)})`;
          ctx.lineWidth = 0.8 + p * 0.7;
          ctx.beginPath();
          ctx.moveTo(getBoundaryX(0, ry) + 2, ry);
          ctx.lineTo(getBoundaryX(nLanes, ry) - 2, ry);
          ctx.stroke();
        }

        // C. Hendiduras divisorias de carril grabadas en 3D (Sombra de surco + Bisel especular blanco)
        // En Modo Espejo activo, las líneas rectas se detienen donde empieza la torsión 3D de los carriles
        const mirrorP = (this.isMirrorModeActive || (typeof window !== 'undefined' && window.isMirrorModeActive))
          ? (this._mirrorPhaseProgress || 0)
          : 0;
        const straightEndY = mirrorP > 0.05
          ? (horizonY + (hitY - horizonY) * 0.30)
          : bottomY;

        ctx.strokeStyle = 'rgba(51, 65, 85, 0.34)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let l = 1; l < nLanes; l++) {
          ctx.moveTo(getBoundaryX(l, horizonY), horizonY);
          ctx.lineTo(getBoundaryX(l, straightEndY), straightEndY);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let l = 1; l < nLanes; l++) {
          ctx.moveTo(getBoundaryX(l, horizonY) + 1.4, horizonY);
          ctx.lineTo(getBoundaryX(l, straightEndY) + 1.8, straightEndY);
        }
        ctx.stroke();

        if (mirrorP > 0.05 && mirrorP < 0.99) {
          const restAlpha = (1 - mirrorP);
          ctx.strokeStyle = `rgba(51, 65, 85, ${(0.34 * restAlpha).toFixed(3)})`;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (let l = 1; l < nLanes; l++) {
            ctx.moveTo(getBoundaryX(l, straightEndY), straightEndY);
            ctx.lineTo(getBoundaryX(l, bottomY), bottomY);
          }
          ctx.stroke();
        }
      }

      // D. SOMBRA 3D DIFUMINADA AL FINAL DE LA PISTA (Horizonte profundo sin bloques negros)
      if (this._trackHorizonShadowGrad) {
        const shadowEndY = horizonY + (hitY - horizonY) * 0.30;
        const sL_bot = getBoundaryX(0, shadowEndY);
        const sR_bot = getBoundaryX(nLanes, shadowEndY);
        ctx.save();
        ctx.fillStyle = this._trackHorizonShadowGrad;
        ctx.beginPath();
        ctx.moveTo(tL_top - 1, horizonY);
        ctx.lineTo(tR_top + 1, horizonY);
        ctx.lineTo(sR_bot + 1, shadowEndY);
        ctx.lineTo(sL_bot - 1, shadowEndY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 2. RESPLANDOR DIFUMINADO EN EL CARRIL AL TOCAR UNA TECLA (Color exacto de PERFECT+, PERFECT, GREAT, GOOD - 0 Gradient Allocs por frame)
      const hitGradCacheKey = `${this.width}_${hitY}_${horizonY}_${nLanes}`;
      if (!this._laneTapGradCache || this._laneTapGradCacheKey !== hitGradCacheKey) {
        this._laneTapGradCache = new Map();
        this._laneTapGradCacheKey = hitGradCacheKey;
      }

      for (let l = 0; l < nLanes; l++) {
        const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
        const isHolding = this.activeHolds.has(l);
        const glow = this.laneGlows[l] || 0;

        if (isHolding || flashTimer > 0.005 || glow > 0.02) {
          const flashCol = isRiverTrack
            ? '#38bdf8'
            : ((Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || this.getJudgeGlowColor('perfectPlus'));
          const intensity = isHolding
            ? 0.88
            : Math.min(1.0, Math.max(flashTimer / 0.28, glow * 0.75));
          const easeGlow = Math.pow(intensity, 0.85);

          const cKey = `${l}_${flashCol}`;
          let cached = this._laneTapGradCache.get(cKey);
          if (!cached) {
            const rgb = hexToRgb(flashCol);
            const auraTopY = horizonY + (hitY - horizonY) * 0.22;
            const auraBotY = hitY + 30;
            const aL_top = getBoundaryX(l, auraTopY);
            const aR_top = getBoundaryX(l + 1, auraTopY);
            const aL_bot = getBoundaryX(l, auraBotY);
            const aR_bot = getBoundaryX(l + 1, auraBotY);

            const vGrad = ctx.createLinearGradient(0, auraBotY, 0, auraTopY);
            vGrad.addColorStop(0.00, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.62)`);
            vGrad.addColorStop(0.14, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.54)`);
            vGrad.addColorStop(0.32, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.36)`);
            vGrad.addColorStop(0.55, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`);
            vGrad.addColorStop(0.78, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`);
            vGrad.addColorStop(1.00, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.000)`);

            const hitCx = (getBoundaryX(l, hitY) + getBoundaryX(l + 1, hitY)) * 0.5;
            const laneWAtHit = Math.max(30, getBoundaryX(l + 1, hitY) - getBoundaryX(l, hitY));
            const bloomCy = hitY - 8;
            const bloomRadius = laneWAtHit * 0.95;

            const rGrad = ctx.createRadialGradient(hitCx, bloomCy, 2, hitCx, bloomCy, bloomRadius);
            rGrad.addColorStop(0.00, `rgba(255, 255, 255, 0.75)`);
            rGrad.addColorStop(0.22, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.72)`);
            rGrad.addColorStop(0.52, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`);
            rGrad.addColorStop(0.80, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
            rGrad.addColorStop(1.00, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.000)`);

            cached = { auraTopY, auraBotY, aL_top, aR_top, aL_bot, aR_bot, vGrad, rGrad };
            if (this._laneTapGradCache.size < 36) {
              this._laneTapGradCache.set(cKey, cached);
            }
          }

          ctx.save();
          ctx.globalAlpha = easeGlow;

          // A. Degradado longitudinal ultra-difuminado que nace en el receptor y se disipa suavemente por el carril
          ctx.fillStyle = cached.vGrad;
          ctx.beginPath();
          ctx.moveTo(cached.aL_top, cached.auraTopY);
          ctx.lineTo(cached.aR_top, cached.auraTopY);
          ctx.lineTo(cached.aR_bot, cached.auraBotY);
          ctx.lineTo(cached.aL_bot, cached.auraBotY);
          ctx.closePath();
          ctx.fill();

          // B. Nebulosa elíptica radial difuminada centrada en la zona de impacto del carril
          ctx.fillStyle = cached.rGrad;
          ctx.fill();

          ctx.restore();
        }
      }

      // 2B. MODO ESPEJO (OJEPSƎ): CRUCE TRIDIMENSIONAL DE CARRILES EN LA PISTA (S-Curve Highway Weave)
      if (this.isMirrorModeActive || (typeof window !== 'undefined' && window.isMirrorModeActive)) {
        this.renderMirrorTrackWeave(ctx, cTime, horizonY, hitY, bottomY);
      }

      if (isRiverTrack) {
        // =========================================================================
        // 3, 4 y 5 EXCLUSIVOS MODO RÍO: RIBERAS ROCOSAS NATURALES 3D, ESPUMA VIVA,
        // CHORROS DE AGUA RÍTMICOS, VEGETACIÓN Y FOCAS ULTRA REALISTAS EN LAS ROCAS
        // =========================================================================
        const activeTimeMs = cTime >= 0 ? cTime : safePerfNow;
        const riverFlowPos = this._getRiverFlowPos(activeTimeMs);
        const riverFlowPhase = Math.max(0, riverFlowPos * 0.00105);
        const riverScroll = riverFlowPhase % 1.0;
        const curSpeed = this._getRiverSpeedMult(activeTimeMs);
        const speedExcite = Math.max(0, Math.min(1.6, (curSpeed - 0.72) / 0.85));
        const frameScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
        this.borderSurgeL = Math.max(0, (this.borderSurgeL || 0) - 0.045 * frameScale);
        this.borderSurgeR = Math.max(0, (this.borderSurgeR || 0) - 0.045 * frameScale);
        const surgeL = this.borderSurgeL || 0;
        const surgeR = this.borderSurgeR || 0;

        ctx.save();
        // A. Taludes exteriores de roca húmeda de cañón y musgo de ribera a ambos lados del río
        const bankTopW = 24;
        const bankBotW = Math.max(54, this.width * 0.19);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        // Margen rocoso izquierdo
        ctx.moveTo(tL_top, horizonY);
        ctx.lineTo(Math.max(0, tL_top - bankTopW), horizonY);
        ctx.lineTo(Math.max(0, tL_bot - bankBotW), bottomY);
        ctx.lineTo(tL_bot, bottomY);
        ctx.closePath();
        // Margen rocoso derecho
        ctx.moveTo(tR_top, horizonY);
        ctx.lineTo(Math.min(this.width, tR_top + bankTopW), horizonY);
        ctx.lineTo(Math.min(this.width, tR_bot + bankBotW), bottomY);
        ctx.lineTo(tR_bot, bottomY);
        ctx.closePath();
        ctx.fill();

        // B. Chorros laterales de espuma y salpicaduras rítmicas de agua (reemplazan el ecualizador de fuego/neón)
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const numWaterJets = 22;
        const startY = horizonY + 18;
        const spanY = Math.max(60, (hitY - 14) - startY);
        for (let j = 0; j < numWaterJets; j++) {
          const pNorm = j / (numWaterJets - 1);
          const p = Math.pow(pNorm, 1.35);
          const yPos = startY + spanY * p;
          const waveL = 0.45 + 0.55 * Math.sin(p * 11.0 - activeTimeMs * 0.007 + j);
          const waveR = 0.45 + 0.55 * Math.cos(p * 11.0 - activeTimeMs * 0.007 + j * 1.3);
          const jetReachL = (10 + 34 * p) * waveL * (1.0 + beatPulse * 0.45 + surgeL * 0.55 + speedExcite * 0.30);
          const jetReachR = (10 + 34 * p) * waveR * (1.0 + beatPulse * 0.45 + surgeR * 0.55 + speedExcite * 0.30);
          const xL = getBoundaryX(0, yPos);
          const xR = getBoundaryX(3, yPos);

          ctx.strokeStyle = (j % 2 === 0)
            ? `rgba(186, 230, 253, ${(0.28 + beatPulse * 0.18).toFixed(2)})`
            : `rgba(56, 189, 248, ${(0.24 + speedExcite * 0.16).toFixed(2)})`;
          ctx.lineWidth = 2.4 + 3.2 * p;
          ctx.beginPath();
          ctx.moveTo(xL + 2, yPos);
          ctx.quadraticCurveTo(xL - jetReachL * 0.5, yPos - 6 * p, xL - jetReachL, yPos + 3 * p);
          ctx.moveTo(xR - 2, yPos);
          ctx.quadraticCurveTo(xR + jetReachR * 0.5, yPos - 6 * p, xR + jetReachR, yPos + 3 * p);
          ctx.stroke();
        }
        ctx.restore();

        // C. Orilla continua de espuma blanca hirviente donde el agua rompe contra las rocas laterales
        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0;
          const edgeIdx = isLeft ? 0 : 3;
          const sign = isLeft ? 1 : -1;

          ctx.strokeStyle = 'rgba(125, 211, 252, 0.48)';
          ctx.lineWidth = 8.0;
          ctx.beginPath();
          const foamSteps = 26;
          for (let s = 0; s <= foamSteps; s++) {
            const u = s / foamSteps;
            const p = Math.pow(u, 1.65);
            const fy = horizonY + (bottomY - horizonY) * p;
            const foamOsc = Math.sin(u * 18.0 - riverFlowPhase * Math.PI * 6 + side * 2.4) * (3.5 + speedExcite * 2.5) * p;
            const fxPos = getBoundaryX(edgeIdx, fy) + sign * (3.0 * p) + foamOsc;
            if (s === 0) ctx.moveTo(fxPos, fy);
            else ctx.lineTo(fxPos, fy);
          }
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.lineWidth = 3.0 + beatPulse * 1.2;
          ctx.stroke();
        }

        // D. Grandes Rocas de Río esculpidas en 3D con musgo esmeralda y helechos en ambos márgenes
        const bankRocks = 16;
        for (let b = 0; b < bankRocks; b++) {
          const u = ((b / bankRocks) + riverFlowPhase) % 1.0;
          const p = Math.pow(u, 1.7);
          const ry = horizonY + (bottomY - horizonY) * p;
          const sc = 0.42 + 0.68 * p;
          const rW = (13 + (b % 4) * 5.5) * sc;
          const rH = (8.5 + (b % 3) * 3.8) * sc;

          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const bx = getBoundaryX(isLeft ? 0 : 3, ry) + (isLeft ? -rW * 0.42 : rW * 0.42);

            // Anillo de espuma blanca rompiendo alrededor de cada peñasco
            ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
            ctx.beginPath();
            ctx.ellipse(bx + (isLeft ? 5 : -5) * sc, ry + 1.5 * sc, rW * 1.08, rH * 1.05, 0, 0, Math.PI * 2);
            ctx.fill();

            // Sombra base del peñasco
            ctx.fillStyle = '#090f1d';
            ctx.beginPath();
            ctx.ellipse(bx, ry + rH * 0.25, rW * 1.04, rH * 0.95, isLeft ? 0.18 : -0.18, 0, Math.PI * 2);
            ctx.fill();

            // Cuerpo principal de roca basáltica húmeda con facetas
            ctx.fillStyle = (b % 2 === 0) ? '#334155' : '#475569';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = Math.max(1, 1.6 * sc);
            ctx.beginPath();
            ctx.ellipse(bx, ry, rW, rH, isLeft ? 0.18 : -0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Brillo especular de roca mojada en la cara superior
            ctx.fillStyle = 'rgba(186, 230, 253, 0.34)';
            ctx.beginPath();
            ctx.ellipse(bx + (isLeft ? 2 : -2) * sc, ry - rH * 0.28, rW * 0.58, rH * 0.38, isLeft ? 0.12 : -0.12, 0, Math.PI * 2);
            ctx.fill();

            // Musgo húmedo y juncos mecidos por la brisa del río
            if (b % 2 === 0) {
              ctx.fillStyle = 'rgba(34, 197, 94, 0.74)';
              ctx.beginPath();
              ctx.ellipse(bx - (isLeft ? 2 : -2) * sc, ry - rH * 0.22, rW * 0.46, rH * 0.34, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // E. Nenúfares flotando suavemente junto a los márgenes de las orillas
        if (this._riverLilyPads && this._riverLilyPadSprite) {
          for (let i = 0; i < this._riverLilyPads.length; i++) {
            const pad = this._riverLilyPads[i];
            const uPad = (pad.p + riverFlowPhase * 0.5) % 1.0;
            const pPad = Math.pow(uPad, 1.7);
            const py = horizonY + (bottomY - horizonY) * pPad;
            const px = getBoundaryX(pad.side === 0 ? 0.14 : 2.86, py);
            const pSc = (0.45 + 0.55 * pPad) * 34;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(pad.rot + activeTimeMs * 0.0005);
            ctx.drawImage(this._riverLilyPadSprite, -pSc * 0.5, -pSc * 0.5, pSc, pSc);
            ctx.restore();
          }
        }

        // F. Focas Ultra Realistas tomando el sol y asomándose curiosas en las rocas de las orillas
        if (this._riverBankSeals && this._riverSealBustSprites && this._riverSealBustSprites.length > 0) {
          for (let i = 0; i < this._riverBankSeals.length; i++) {
            const bSeal = this._riverBankSeals[i];
            const uSeal = (bSeal.u + riverFlowPhase * 0.32) % 1.0;
            if (uSeal < 0.10 || uSeal > 0.92) continue;
            const pSeal = Math.pow(uSeal, 1.7);
            const sy = horizonY + (bottomY - horizonY) * pSeal;
            const isLeft = bSeal.side === 0;
            const sc = (0.44 + 0.68 * pSeal);
            const sx = getBoundaryX(isLeft ? 0.04 : 2.96, sy) + (isLeft ? -8 * sc : 8 * sc);
            const bobY = Math.sin(activeTimeMs * 0.0042 + bSeal.bobPhase) * 3.5 * sc;
            const headTilt = Math.sin(activeTimeMs * 0.0028 + bSeal.bobPhase) * 0.08;
            const sprite = this._riverSealBustSprites[bSeal.variant % this._riverSealBustSprites.length];
            const drawSz = 62 * sc;

            ctx.save();
            ctx.translate(sx, sy + bobY);
            if (!isLeft) ctx.scale(-1, 1);
            ctx.rotate(headTilt);
            ctx.drawImage(sprite, -drawSz * 0.5, -drawSz * 0.55, drawSz, drawSz);
            ctx.restore();
          }
        }

        ctx.restore();
      } else {
        // 3. BISEL METÁLICO 3D DE PRECISIÓN EN LOS BORDES DE LA AUTOPISTA (Estilo Beatstar Original)
        const railTopW = 5.0;
        const railBotW = 14.0;

        ctx.save();
        ctx.fillStyle = '#0d1322';
        // Bisel lateral izquierdo
        ctx.beginPath();
        ctx.moveTo(tL_top, horizonY);
        ctx.lineTo(Math.max(0, tL_top - railTopW), horizonY);
        ctx.lineTo(Math.max(0, tL_bot - railBotW), bottomY);
        ctx.lineTo(tL_bot, bottomY);
        ctx.closePath();
        ctx.fill();

        // Bisel lateral derecho
        ctx.beginPath();
        ctx.moveTo(tR_top, horizonY);
        ctx.lineTo(Math.min(this.width, tR_top + railTopW), horizonY);
        ctx.lineTo(Math.min(this.width, tR_bot + railBotW), bottomY);
        ctx.lineTo(tR_bot, bottomY);
        ctx.closePath();
        ctx.fill();

        // Arista exterior cromada de los raíles 3D
        ctx.strokeStyle = 'rgba(148, 178, 214, 0.48)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, tL_top - railTopW), horizonY);
        ctx.lineTo(Math.max(0, tL_bot - railBotW), bottomY);
        ctx.moveTo(Math.min(this.width, tR_top + railTopW), horizonY);
        ctx.lineTo(Math.min(this.width, tR_bot + railBotW), bottomY);
        ctx.stroke();
        ctx.restore();

        // 4. ALAS DE RITMO NEÓN ESTILO BEATSTAR ORIGINAL + EFECTOS ESPECIALES DE BORDE (Fuego, Hielo, Rayos, etc.)
        const numRibs = 34;
        const bpmSpeed = (normBpm / 60) * Math.PI * 2;
        const theme = this.getEffectBorderTheme(this.activeEffect);
        const fx = theme.id;
        const timeSec = safePerfNow * 0.001;

        const frameScale = Math.min(2.5, (this._frameDt || 0.00833) * 60);
        this.borderSurgeL = Math.max(0, (this.borderSurgeL || 0) - 0.045 * frameScale);
        this.borderSurgeR = Math.max(0, (this.borderSurgeR || 0) - 0.045 * frameScale);
        const surgeL = this.borderSurgeL || 0;
        const surgeR = this.borderSurgeR || 0;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const tLx_top = getBoundaryX(0, horizonY);
        const tLx_bot = getBoundaryX(0, bottomY);
        const dyL = bottomY - horizonY;
        const dxL = tLx_bot - tLx_top;
        const lenL = Math.hypot(dxL, dyL) || 1;
        const normLx = -dyL / lenL;
        const normLy = dxL / lenL;

        const tRx_top = getBoundaryX(nLanes, horizonY);
        const tRx_bot = getBoundaryX(nLanes, bottomY);
        const dyR = bottomY - horizonY;
        const dxR = tRx_bot - tRx_top;
        const lenR = Math.hypot(dxR, dyR) || 1;
        const normRx = dyR / lenR;
        const normRy = -dxR / lenR;

        // --- CAPA 1: AURA DIFUMINADA VOLUMÉTRICA LATERAL FIEL AL TEMA DEL EFECTO (Pre-cacheada: 0 allocs/frame) ---
        const auraSpanTop = 34 + beatPulse * 12;
        const auraSpanBot = 82 + beatPulse * 24;
        const borderCacheKey = `${this.width}_${this.height}_${fx}_${nLanes}`;
        if (!this._borderGradCache || this._borderGradCache.key !== borderCacheKey) {
          const primaryWingCol = theme.cInner;
          const midWingCol = theme.cMid;
          const outerWingCol = theme.cOuter;

          const lAura = ctx.createLinearGradient(
            (tLx_top + tLx_bot) * 0.5,
            (horizonY + bottomY) * 0.5,
            (tLx_top + tLx_bot) * 0.5 + normLx * 82,
            (horizonY + bottomY) * 0.5 + normLy * 82
          );
          lAura.addColorStop(0.0, hexToRgba(primaryWingCol, 0.46));
          lAura.addColorStop(0.40, hexToRgba(midWingCol, 0.25));
          lAura.addColorStop(0.80, hexToRgba(outerWingCol, 0.08));
          lAura.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

          const rAura = ctx.createLinearGradient(
            (tRx_top + tRx_bot) * 0.5,
            (horizonY + bottomY) * 0.5,
            (tRx_top + tRx_bot) * 0.5 + normRx * 82,
            (horizonY + bottomY) * 0.5 + normRy * 82
          );
          rAura.addColorStop(0.0, hexToRgba(primaryWingCol, 0.46));
          rAura.addColorStop(0.40, hexToRgba(midWingCol, 0.25));
          rAura.addColorStop(0.80, hexToRgba(outerWingCol, 0.08));
          rAura.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

          const vGrad = ctx.createLinearGradient(0, horizonY, 0, hitY);
          vGrad.addColorStop(0.00, outerWingCol);
          vGrad.addColorStop(0.32, midWingCol);
          vGrad.addColorStop(0.72, primaryWingCol);
          vGrad.addColorStop(1.00, '#ffffff');

          this._borderGradCache = { key: borderCacheKey, lAura, rAura, vGrad, primaryWingCol, midWingCol };
        }

        ctx.globalAlpha = Math.min(1.0, 0.72 + surgeL * 0.35 + beatPulse * 0.20);
        ctx.fillStyle = this._borderGradCache.lAura;
        ctx.beginPath();
        ctx.moveTo(tLx_top - railTopW, horizonY);
        ctx.lineTo(tLx_top + normLx * auraSpanTop, horizonY + normLy * auraSpanTop);
        ctx.lineTo(tLx_bot + normLx * auraSpanBot, bottomY + normLy * auraSpanBot);
        ctx.lineTo(tLx_bot - railBotW, bottomY);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = Math.min(1.0, 0.72 + surgeR * 0.35 + beatPulse * 0.20);
        ctx.fillStyle = this._borderGradCache.rAura;
        ctx.beginPath();
        ctx.moveTo(tRx_top + railTopW, horizonY);
        ctx.lineTo(tRx_top + normRx * auraSpanTop, horizonY + normRy * auraSpanTop);
        ctx.lineTo(tRx_bot + normRx * auraSpanBot, bottomY + normRy * auraSpanBot);
        ctx.lineTo(tRx_bot + railBotW, bottomY);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // --- CAPA 2: EFECTOS EXTRA TEMÁTICOS EN LOS BORDES LATERALES (Fuego 3D, Hielo, Relámpagos, Plasma, Meteoros) ---
        if (fx === 'solar_inferno' || fx === 'dragon_fire') {
          const numFlames = 18;
          ctx.fillStyle = hexToRgba(theme.cMid, 0.54);
          ctx.beginPath();
          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const nX = isLeft ? normLx : normRx;
            const nY = isLeft ? normLy : normRy;
            const sideSurge = isLeft ? surgeL : surgeR;
            for (let f = 0; f < numFlames; f++) {
              const p0 = Math.pow(f / numFlames, 1.2);
              const p1 = Math.pow((f + 1.35) / numFlames, 1.2);
              const y0 = horizonY + (bottomY - horizonY) * p0;
              const y1 = horizonY + (bottomY - horizonY) * p1;
              const yMid = (y0 + y1) * 0.5;
              const x0 = getBoundaryX(isLeft ? 0 : nLanes, y0);
              const x1 = getBoundaryX(isLeft ? 0 : nLanes, y1);
              const xMid = (x0 + x1) * 0.5;
              const flicker = 0.55 + 0.30 * Math.sin(f * 2.1 - timeSec * 11.5 + side * 1.7) + 0.20 * Math.cos(f * 3.7 - timeSec * 7.8);
              const reach = (18 + 38 * p0) * flicker * (1.0 + beatPulse * 0.35 + sideSurge * 0.45);
              const liftY = -(10 + 22 * p0) * (0.7 + 0.3 * Math.sin(timeSec * 9.0 + f));
              const tipX = xMid + nX * reach;
              const tipY = yMid + nY * reach + liftY;
              ctx.moveTo(x0, y0);
              ctx.quadraticCurveTo(xMid + nX * reach * 0.65, y0 + liftY * 0.4, tipX, tipY);
              ctx.quadraticCurveTo(xMid + nX * reach * 0.55, y1, x1, y1);
            }
          }
          ctx.fill();

          ctx.fillStyle = hexToRgba(theme.cInner, 0.68);
          ctx.beginPath();
          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const nX = isLeft ? normLx : normRx;
            const nY = isLeft ? normLy : normRy;
            const sideSurge = isLeft ? surgeL : surgeR;
            for (let f = 0; f < numFlames; f++) {
              const p0 = Math.pow(f / numFlames, 1.2);
              const p1 = Math.pow((f + 1.35) / numFlames, 1.2);
              const y0 = horizonY + (bottomY - horizonY) * p0;
              const y1 = horizonY + (bottomY - horizonY) * p1;
              const yMid = (y0 + y1) * 0.5;
              const x0 = getBoundaryX(isLeft ? 0 : nLanes, y0);
              const x1 = getBoundaryX(isLeft ? 0 : nLanes, y1);
              const xMid = (x0 + x1) * 0.5;
              const flicker = 0.55 + 0.30 * Math.sin(f * 2.1 - timeSec * 11.5 + side * 1.7) + 0.20 * Math.cos(f * 3.7 - timeSec * 7.8);
              const reach = (18 + 38 * p0) * flicker * (1.0 + beatPulse * 0.35 + sideSurge * 0.45);
              const liftY = -(10 + 22 * p0) * (0.7 + 0.3 * Math.sin(timeSec * 9.0 + f));
              ctx.moveTo(x0, y0 + (y1 - y0) * 0.18);
              ctx.quadraticCurveTo(xMid + nX * reach * 0.38, yMid + liftY * 0.35, xMid + nX * reach * 0.58, yMid + nY * reach * 0.58 + liftY * 0.65);
              ctx.quadraticCurveTo(xMid + nX * reach * 0.32, y1 - (y1 - y0) * 0.15, x1, y1 - (y1 - y0) * 0.18);
            }
          }
          ctx.fill();
        } else if (fx === 'cryo_blizzard') {
          const numSpikes = 18;
          ctx.fillStyle = hexToRgba(theme.cInner, 0.56);
          ctx.beginPath();
          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const nX = isLeft ? normLx : normRx;
            const nY = isLeft ? normLy : normRy;
            const sideSurge = isLeft ? surgeL : surgeR;
            for (let k = 0; k < numSpikes; k++) {
              const p = Math.pow(k / (numSpikes - 1), 1.22);
              const yBase = horizonY + (bottomY - horizonY) * p;
              const xBase = getBoundaryX(isLeft ? 0 : nLanes, yBase);
              const pulseWave = 0.6 + 0.4 * Math.sin(p * 10 - timeSec * 5.5 + side);
              const spikeLen = (16 + 34 * p) * pulseWave * (1 + beatPulse * 0.3 + sideSurge * 0.4);
              const halfW = 5 + 9 * p;
              const tipX = xBase + nX * spikeLen;
              const tipY = yBase + nY * spikeLen - 8 * p;
              ctx.moveTo(xBase, yBase - halfW);
              ctx.lineTo(tipX, tipY);
              ctx.lineTo(xBase, yBase + halfW);
            }
          }
          ctx.fill();
        } else if (fx === 'zeus_lightning') {
          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const nX = isLeft ? normLx : normRx;
            const nY = isLeft ? normLy : normRy;
            const sideSurge = isLeft ? surgeL : surgeR;

            ctx.beginPath();
            const steps = 26;
            for (let k = 0; k <= steps; k++) {
              const p = k / steps;
              const yPos = horizonY + (bottomY - horizonY) * p;
              const xRail = getBoundaryX(isLeft ? 0 : nLanes, yPos);
              const jag = (10 + 26 * p) * (0.45 + 0.55 * Math.abs(Math.sin(k * 4.3 - timeSec * 24 + side * 2))) * (1 + sideSurge * 0.45);
              const lx = xRail + nX * jag;
              const ly = yPos + nY * jag;
              if (k === 0) ctx.moveTo(lx, ly);
              else ctx.lineTo(lx, ly);
            }
            ctx.strokeStyle = hexToRgba(theme.cMid, 0.72);
            ctx.lineWidth = 5.5;
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.9;
            ctx.stroke();
          }
        } else if (fx === 'aurora_borealis' || fx === 'deep_cosmos' || fx === 'cyber_neon' || fx === 'black_hole') {
          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const nX = isLeft ? normLx : normRx;
            const nY = isLeft ? normLy : normRy;
            const sideSurge = isLeft ? surgeL : surgeR;

            for (let ribbon = 0; ribbon < 2; ribbon++) {
              ctx.beginPath();
              const steps = 24;
              for (let k = 0; k <= steps; k++) {
                const p = k / steps;
                const yPos = horizonY + (bottomY - horizonY) * p;
                const xRail = getBoundaryX(isLeft ? 0 : nLanes, yPos);
                const wave = 0.55 + 0.45 * Math.sin(p * 11.0 - timeSec * (4.5 + ribbon * 2.2) + ribbon * 1.9 + side);
                const offset = (12 + 34 * p) * wave * (1 + beatPulse * 0.3 + sideSurge * 0.4);
                const rx = xRail + nX * offset;
                const ry = yPos + nY * offset;
                if (k === 0) ctx.moveTo(rx, ry);
                else ctx.lineTo(rx, ry);
              }
              ctx.strokeStyle = ribbon === 0 ? theme.cMid : theme.cInner;
              ctx.lineWidth = ribbon === 0 ? 5.0 : 2.6;
              ctx.stroke();
            }
          }
        } else if (fx === 'grand_fireworks' || fx === 'supernova_burst' || fx === 'asteroid_impact' || fx === 'quantum_prism') {
          const numNodes = 14;
          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const nX = isLeft ? normLx : normRx;
            const nY = isLeft ? normLy : normRy;
            const sideSurge = isLeft ? surgeL : surgeR;

            for (let k = 1; k < numNodes; k++) {
              const p = Math.pow(((k / numNodes) + (timeSec * 0.18) % (1 / numNodes)), 1.25);
              if (p > 1.0) continue;
              const yPos = horizonY + (bottomY - horizonY) * p;
              const xRail = getBoundaryX(isLeft ? 0 : nLanes, yPos);
              const distOut = (16 + 32 * p) * (0.65 + 0.35 * Math.sin(k * 2.7 + timeSec * 5)) * (1 + sideSurge * 0.35);
              const nx = xRail + nX * distOut;
              const ny = yPos + nY * distOut;
              const sz = (4 + 7 * p) * (1 + beatPulse * 0.35);

              if (fx === 'quantum_prism') {
                ctx.save();
                ctx.translate(nx, ny);
                ctx.rotate(timeSec * 3.0 + k);
                ctx.strokeStyle = k % 2 === 0 ? theme.cInner : theme.cMid;
                ctx.lineWidth = 1.8;
                ctx.strokeRect(-sz * 0.5, -sz * 0.5, sz, sz);
                ctx.restore();
              } else {
                ctx.strokeStyle = k % 2 === 0 ? theme.cInner : theme.cMid;
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(nx - sz, ny);
                ctx.lineTo(nx + sz, ny);
                ctx.moveTo(nx, ny - sz);
                ctx.lineTo(nx, ny + sz);
                ctx.stroke();
              }
            }
          }
        } else if (fx === 'astral_transcendence') {
          // TRIPLE HÉLICE CELESTIAL EN PERSPECTIVA 3D + PORTALES DE ASTROLABIO EN LOS LATERALES DE LA PISTA
          const strandCols = ['#fde047', '#00f2fe', '#ff007f'];
          for (let side = 0; side < 2; side++) {
            const isLeft = side === 0;
            const nX = isLeft ? normLx : normRx;
            const nY = isLeft ? normLy : normRy;
            const sideSurge = isLeft ? surgeL : surgeR;

            for (let strand = 0; strand < 3; strand++) {
              ctx.beginPath();
              const steps = 24;
              for (let k = 0; k <= steps; k++) {
                const p = k / steps;
                const yPos = horizonY + (bottomY - horizonY) * p;
                const xRail = getBoundaryX(isLeft ? 0 : nLanes, yPos);
                const phase = p * 12.0 - timeSec * 5.2 + (strand * Math.PI * 2) / 3 + side * 1.5;
                const wave = 0.55 + 0.45 * Math.sin(phase);
                const offset = (14 + 42 * p) * wave * (1 + beatPulse * 0.35 + sideSurge * 0.45);
                const rx = xRail + nX * offset;
                const ry = yPos + nY * offset;
                if (k === 0) ctx.moveTo(rx, ry);
                else ctx.lineTo(rx, ry);
              }
              ctx.strokeStyle = strandCols[strand];
              ctx.lineWidth = strand === 0 ? 4.2 : 2.6;
              ctx.stroke();
            }

            // Portales romboidales sagrados ascendiendo por el borde exterior de la pista
            const numRunes = 10;
            for (let rIdx = 1; rIdx < numRunes; rIdx++) {
              const p = Math.pow(((rIdx / numRunes) + (timeSec * 0.14) % (1 / numRunes)), 1.22);
              if (p > 1.0) continue;
              const yPos = horizonY + (bottomY - horizonY) * p;
              const xRail = getBoundaryX(isLeft ? 0 : nLanes, yPos);
              const distOut = (22 + 38 * p) * (1 + beatPulse * 0.25 + sideSurge * 0.35);
              const rx = xRail + nX * distOut;
              const ry = yPos + nY * distOut;
              const sz = (5 + 8 * p) * (1 + beatPulse * 0.3);

              ctx.strokeStyle = rIdx % 2 === 0 ? '#fde047' : '#00f2fe';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(rx, ry - sz);
              ctx.lineTo(rx + sz, ry);
              ctx.lineTo(rx, ry + sz);
              ctx.lineTo(rx - sz, ry);
              ctx.closePath();
              ctx.stroke();
            }
          }

          // EXTRA EXCLUSIVO CALIDAD TRASCENDENTAL: CORONA DEL SERAFÍN EN EL HORIZONTE + ONDA DE RESONANCIA EN COMBOS
          if (!this._transcendentCrownSprite) {
            const cCan = document.createElement('canvas');
            cCan.width = 140;
            cCan.height = 140;
            const cCtx = cCan.getContext('2d');
            const cMid = 70;
            cCtx.globalCompositeOperation = 'lighter';

            const rg = cCtx.createRadialGradient(cMid, cMid, 4, cMid, cMid, 64);
            rg.addColorStop(0.0, 'rgba(255, 255, 255, 0.92)');
            rg.addColorStop(0.35, 'rgba(0, 242, 254, 0.48)');
            rg.addColorStop(0.7, 'rgba(168, 85, 247, 0.22)');
            rg.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
            cCtx.fillStyle = rg;
            cCtx.fillRect(0, 0, 140, 140);

            cCtx.strokeStyle = '#fde047';
            cCtx.lineWidth = 2.2;
            cCtx.beginPath();
            cCtx.arc(cMid, cMid, 42, 0, Math.PI * 2);
            cCtx.stroke();

            cCtx.strokeStyle = '#00f2fe';
            cCtx.lineWidth = 1.6;
            cCtx.beginPath();
            cCtx.arc(cMid, cMid, 54, 0, Math.PI * 2);
            cCtx.stroke();

            for (let s = 0; s < 8; s++) {
              const a = (s * Math.PI) / 4;
              const rOut = s % 2 === 0 ? 58 : 36;
              cCtx.strokeStyle = s % 2 === 0 ? '#fde047' : '#ff007f';
              cCtx.beginPath();
              cCtx.moveTo(cMid + Math.cos(a) * 14, cMid + Math.sin(a) * 14);
              cCtx.lineTo(cMid + Math.cos(a) * rOut, cMid + Math.sin(a) * rOut);
              cCtx.stroke();
            }
            this._transcendentCrownSprite = cCan;
          }

          const crownX = this.width * 0.5;
          const crownY = horizonY + 22;
          const crownSz = (72 + beatPulse * 14);
          ctx.save();
          ctx.translate(crownX, crownY);
          ctx.rotate(timeSec * 0.85);
          ctx.globalAlpha = 0.85 + beatPulse * 0.15;
          ctx.drawImage(this._transcendentCrownSprite, -crownSz * 0.5, -crownSz * 0.5, crownSz, crownSz);
          ctx.restore();

          // Onda de Resonancia Dimensional que recorre toda la pista en los combos de racha
          if (this._transcendentResonancePulse && this._transcendentResonancePulse > 0.01) {
            const rp = 1.0 - this._transcendentResonancePulse;
            this._transcendentResonancePulse = Math.max(0, this._transcendentResonancePulse - 0.028 * frameScale);
            const waveY = horizonY + (hitY - horizonY) * Math.pow(rp, 1.25);
            const wL = getBoundaryX(0, waveY) - 18;
            const wR = getBoundaryX(nLanes, waveY) + 18;
            ctx.strokeStyle = `rgba(253, 224, 71, ${(this._transcendentResonancePulse * 0.88).toFixed(3)})`;
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.moveTo(wL, waveY);
            ctx.quadraticCurveTo(crownX, waveY + 14, wR, waveY);
            ctx.stroke();

            ctx.strokeStyle = `rgba(0, 242, 254, ${(this._transcendentResonancePulse * 0.72).toFixed(3)})`;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(wL + 8, waveY - 8);
            ctx.quadraticCurveTo(crownX, waveY + 4, wR - 8, waveY - 8);
            ctx.stroke();
          }
        }

        // --- CAPA 3: ECUALIZADOR RÍTMICO LATERAL HORIZONTAL EN PERSPECTIVA 3D (Beatstar Original Stage Wings) ---
        const startY = horizonY + 14;
        const endY = hitY - 14;
        const spanRhythmY = Math.max(60, endY - startY);
        const eqSurgesL = this.borderEqLeftSurges;
        const eqSurgesR = this.borderEqRightSurges;
        const borderVertGrad = this._borderGradCache.vGrad;
        const midWingCol = this._borderGradCache.midWingCol;

        if (!this._ribScratch) {
          this._ribScratch = {
            y: new Float32Array(numRibs),
            xStartL: new Float32Array(numRibs),
            lenL: new Float32Array(numRibs),
            xStartR: new Float32Array(numRibs),
            lenR: new Float32Array(numRibs),
            p: new Float32Array(numRibs)
          };
        }
        const rs = this._ribScratch;

        for (let s = 0; s < numRibs; s++) {
          const pNorm = s / (numRibs - 1);
          const p = Math.pow(pNorm, 1.32);
          const yPos = startY + spanRhythmY * p;

          const railWAtY = railTopW + (railBotW - railTopW) * p;
          const railGap = 4.5 + 3.5 * p;
          const xStartL = getBoundaryX(0, yPos) - railWAtY - railGap;
          const xStartR = getBoundaryX(nLanes, yPos) + railWAtY + railGap;

          const maxWingReach = Math.max(12, Math.min(this.width * 0.21, xStartL - 6));

          const cascadeWave = 0.5 + 0.5 * Math.sin(p * 10.5 - audioTime * bpmSpeed);
          const subHarmonic = 0.5 + 0.5 * Math.cos(s * 1.55 + audioTime * bpmSpeed * 0.5);
          const barCadence = (s % 2 === 0) ? 1.0 : 0.70;
          const wingEnvelope = Math.sin(Math.pow(pNorm, 0.72) * Math.PI * 0.94);

          const bandIdx = Math.min(11, Math.floor(pNorm * 12));
          const bandSurgeL = (eqSurgesL ? eqSurgesL[bandIdx] : 0) || 0;
          const bandSurgeR = (eqSurgesR ? eqSurgesR[bandIdx] : 0) || 0;

          const driveL = (0.28 + 0.44 * cascadeWave + 0.28 * subHarmonic) * barCadence * (1.0 + beatPulse * 0.42 + surgeL * 0.48 + bandSurgeL * 0.45);
          const driveR = (0.28 + 0.44 * cascadeWave + 0.28 * subHarmonic) * barCadence * (1.0 + beatPulse * 0.42 + surgeR * 0.48 + bandSurgeR * 0.45);

          const baseMin = 5 + 8 * p;
          const lenLVal = Math.min(maxWingReach, baseMin + maxWingReach * 0.72 * wingEnvelope * Math.min(1.25, driveL));
          const lenRVal = Math.min(maxWingReach, baseMin + maxWingReach * 0.72 * wingEnvelope * Math.min(1.25, driveR));

          rs.y[s] = yPos;
          rs.xStartL[s] = xStartL;
          rs.lenL[s] = lenLVal;
          rs.xStartR[s] = xStartR;
          rs.lenR[s] = lenRVal;
          rs.p[s] = p;
        }

        // Pasada A: Halo exterior difuminado de neón (Batched en 1 draw call)
        ctx.strokeStyle = hexToRgba(midWingCol, 0.30 + beatPulse * 0.14);
        ctx.lineWidth = 6.0;
        ctx.beginPath();
        for (let s = 0; s < numRibs; s++) {
          const yPos = rs.y[s];
          const xL = rs.xStartL[s];
          const xR = rs.xStartR[s];
          ctx.moveTo(xL, yPos);
          ctx.lineTo(xL - rs.lenL[s], yPos);
          ctx.moveTo(xR, yPos);
          ctx.lineTo(xR + rs.lenR[s], yPos);
        }
        ctx.stroke();

        // Pasada B: Cuerpo principal de las barras de ritmo con degradado vertical en perspectiva (1 draw call)
        ctx.strokeStyle = borderVertGrad;
        ctx.lineWidth = 2.6 + beatPulse * 0.55;
        ctx.beginPath();
        for (let s = 0; s < numRibs; s++) {
          const yPos = rs.y[s];
          const xL = rs.xStartL[s];
          const xR = rs.xStartR[s];
          ctx.moveTo(xL, yPos);
          ctx.lineTo(xL - rs.lenL[s], yPos);
          ctx.moveTo(xR, yPos);
          ctx.lineTo(xR + rs.lenR[s], yPos);
        }
        ctx.stroke();

        // Pasada C: Núcleo interior blanco incandescente junto al raíl + Puntas Peak-Hold flotantes (1 draw call)
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.84 + beatPulse * 0.16).toFixed(2)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let s = 0; s < numRibs; s++) {
          const yPos = rs.y[s];
          const xL = rs.xStartL[s];
          const xR = rs.xStartR[s];
          const coreLenL = rs.lenL[s] * 0.56;
          const coreLenR = rs.lenR[s] * 0.56;

          ctx.moveTo(xL, yPos);
          ctx.lineTo(xL - coreLenL, yPos);
          ctx.moveTo(xR, yPos);
          ctx.lineTo(xR + coreLenR, yPos);

          if (s % 2 === 0) {
            const p = rs.p[s];
            const peakGap = 4.0 + 2.5 * p + beatPulse * 2.0;
            const peakDotLen = 2.2 + 2.0 * p;
            const tipL = xL - rs.lenL[s] - peakGap;
            const tipR = xR + rs.lenR[s] + peakGap;
            if (tipL - peakDotLen > 2) {
              ctx.moveTo(tipL, yPos);
              ctx.lineTo(tipL - peakDotLen, yPos);
            }
            if (tipR + peakDotLen < this.width - 2) {
              ctx.moveTo(tipR, yPos);
              ctx.lineTo(tipR + peakDotLen, yPos);
            }
          }
        }
        ctx.stroke();

        ctx.restore();

        // 5. GUÍAS LÁSER DE NEÓN CONTINUAS DE ALTA INTENSIDAD Y PULSOS VIAJEROS DE COMPÁS
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';

        // Halo exterior del raíl láser
        ctx.strokeStyle = hexToRgba(this._borderGradCache.midWingCol, 0.58 + beatPulse * 0.34);
        ctx.lineWidth = 7.2;
        ctx.beginPath();
        ctx.moveTo(tL_top, horizonY);
        ctx.lineTo(tL_bot, bottomY);
        ctx.moveTo(tR_top, horizonY);
        ctx.lineTo(tR_bot, bottomY);
        ctx.stroke();

        // Filamento central blanco puro incandescente del raíl
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(tL_top, horizonY);
        ctx.lineTo(tL_bot, bottomY);
        ctx.moveTo(tR_top, horizonY);
        ctx.lineTo(tR_bot, bottomY);
        ctx.stroke();

        // Pulsos viajeros de energía descendiendo por los raíles al compás del BPM
        const pulseP = Math.pow(beatFraction, 1.5);
        const pulseY0 = horizonY + (hitY - horizonY) * Math.max(0, pulseP - 0.08);
        const pulseY1 = horizonY + (hitY - horizonY) * Math.min(1, pulseP + 0.08);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(getBoundaryX(0, pulseY0), pulseY0);
        ctx.lineTo(getBoundaryX(0, pulseY1), pulseY1);
        ctx.moveTo(getBoundaryX(nLanes, pulseY0), pulseY0);
        ctx.lineTo(getBoundaryX(nLanes, pulseY1), pulseY1);
        ctx.stroke();

        ctx.restore();
      }

    } else {
      // ==========================================
      // 2D NEÓN CLÁSICO (Modo Plano)
      // ==========================================
      const laneW = this.width / nLanes;

      ctx.fillStyle = this._trackGrad || '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);
      if (this._trackEdgeShadowGrad) {
        ctx.fillStyle = this._trackEdgeShadowGrad;
        ctx.fillRect(0, 0, this.width, this.height);
      }

      for (let l = 1; l < nLanes; l++) {
        const lx = l * laneW;
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.28)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, this.height);
        ctx.stroke();
        ctx.restore();
      }

      for (let l = 0; l < nLanes; l++) {
        const isHolding = this.activeHolds.has(l);
        const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
        const glow = this.laneGlows[l] || 0;
        if (isHolding || flashTimer > 0.001 || glow > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const neonGrad = ctx.createLinearGradient(0, hitY, 0, 0);
          let alpha = 0;
          if (isHolding) {
            alpha = 0.85;
          } else if (flashTimer > 0) {
            const p = flashTimer / 0.15;
            alpha = 0.85 * Math.sin(Math.min(1, Math.max(0, p)) * Math.PI * 0.5);
          } else {
            alpha = Math.min(0.80, glow * 0.80);
          }
          const flashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || '#00f2fe';
          const rgb = hexToRgb(flashCol);
          neonGrad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(3)})`);
          neonGrad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(alpha * 0.45).toFixed(3)})`);
          neonGrad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
          ctx.fillStyle = neonGrad;
          ctx.fillRect(l * laneW, 0, laneW, hitY + 20);
          ctx.restore();
        }
      }

    }

    ctx.restore();
  }
    // =========================================================================
    // ZONA PERFECT+ 3D EN PERSPECTIVA CÓNICA REAL CON ANIMACIONES DINÁMICAS
    // =========================================================================
    buildHitLineSprites() {
      const isLarge = (this.keyStyle !== 'compact');
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.82);
      const padH = isLarge ? 84 : 48;
      const yDeckTop = hitY - padH * 0.56;
      const yDeckBot = hitY + padH * 0.60;

      // Degradados pre-cacheados para el chasis 3D y las cavidades en perspectiva (Zero-GC a 120 FPS)
      const deckGrad = this.ctx.createLinearGradient(0, yDeckTop, 0, yDeckBot);
      deckGrad.addColorStop(0.00, '#1e2b48');
      deckGrad.addColorStop(0.18, '#121b30');
      deckGrad.addColorStop(0.55, '#090e1c');
      deckGrad.addColorStop(0.88, '#060913');
      deckGrad.addColorStop(1.00, '#03050a');

      const deckLipGrad = this.ctx.createLinearGradient(0, yDeckBot, 0, yDeckBot + 12);
      deckLipGrad.addColorStop(0.00, '#2a3b60');
      deckLipGrad.addColorStop(0.45, '#121a2e');
      deckLipGrad.addColorStop(1.00, '#04060d');

      const apronGrad = this.ctx.createLinearGradient(0, yDeckBot, 0, this.height + 30);
      apronGrad.addColorStop(0.00, '#050811');
      apronGrad.addColorStop(0.45, '#080d1a');
      apronGrad.addColorStop(1.00, '#020307');

      const wellGrad = this.ctx.createLinearGradient(0, yDeckTop, 0, yDeckBot);
      wellGrad.addColorStop(0.00, '#020409');
      wellGrad.addColorStop(0.40, '#070c18');
      wellGrad.addColorStop(1.00, '#0e172c');

      const plateIdleGrad = this.ctx.createLinearGradient(0, hitY - padH * 0.46, 0, hitY + padH * 0.46);
      plateIdleGrad.addColorStop(0.00, '#2a3550');
      plateIdleGrad.addColorStop(0.28, '#1b2438');
      plateIdleGrad.addColorStop(0.65, '#111726');
      plateIdleGrad.addColorStop(1.00, '#0a0e19');

      const glassBandGrad = this.ctx.createLinearGradient(0, hitY - 14, 0, hitY + 14);
      glassBandGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.22)');
      glassBandGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.06)');
      glassBandGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.14)');
      glassBandGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.06)');
      glassBandGrad.addColorStop(1.00, 'rgba(255, 255, 255, 0.24)');

      this._hitSprites = {
        padH,
        yDeckTop,
        yDeckBot,
        deckGrad,
        deckLipGrad,
        apronGrad,
        wellGrad,
        plateIdleGrad,
        glassBandGrad
      };
      this._hitSpriteSocket = true;
    }

    _traceQuadOn(ctx, x0T, x1T, x0B, x1B, topY, botY, rad) {
      const cr = Math.min(rad, (botY - topY) * 0.35, (x1T - x0T) * 0.30);
      ctx.beginPath();
      if (cr < 1.2) {
        ctx.moveTo(x0T, topY); ctx.lineTo(x1T, topY); ctx.lineTo(x1B, botY); ctx.lineTo(x0B, botY);
        ctx.closePath();
        return;
      }
      ctx.moveTo((x0T + x1T) * 0.5, topY);
      ctx.arcTo(x1T, topY, x1B, botY, cr);
      ctx.arcTo(x1B, botY, x0B, botY, cr);
      ctx.arcTo(x0B, botY, x0T, topY, cr);
      ctx.arcTo(x0T, topY, x1T, topY, cr);
      ctx.closePath();
    }

    renderHitLine(currentTime = null) {
      const ctx = this.ctx;
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.82);
      const is3D = (this.visualDimension !== '2d');
      const nowPerf = this._frameNow || performance.now();
      const cTime = Number.isFinite(currentTime) ? currentTime : this.getCurrentGameTimeMs(nowPerf);

      if (is3D && !this._hitSprites) {
        this.buildHitLineSprites();
      }

      // Color reactivo según multiplicador y paleta
      const mult = this.multiplier || 1;
      const palette = this.activeSongPalette || (typeof SONG_COLOR_PALETTES !== 'undefined' ? SONG_COLOR_PALETTES.classic : null);
      let laserCol = palette ? (palette.primary || '#00f5a0') : '#00f5a0';
      let accentCol = palette ? (palette.glow || '#00f2fe') : '#00f2fe';
      if (mult === 2) {
        laserCol = '#ffd700';
        accentCol = '#ff9900';
      } else if (mult === 3) {
        laserCol = '#ff007f';
        accentCol = '#d946ef';
      } else if (mult === 4) {
        laserCol = '#00f2fe';
        accentCol = '#38bdf8';
      } else if (mult >= 5) {
        laserCol = '#00f5a0';
        accentCol = '#ffd700';
      }
      const laserRgb = hexToRgb(laserCol);
      const accentRgb = hexToRgb(accentCol);

      // Pulso rítmico sincronizado al BPM (monotónico en cuenta atrás)
      const songBpm = (this.beatmapData && this.beatmapData.bpm) ? Math.max(40, this.beatmapData.bpm) : 128;
      let normBpm = songBpm;
      while (normBpm > 175) normBpm /= 2;
      while (normBpm < 75) normBpm *= 2;
      const beatInterval = 60 / normBpm;
      const audioTime = (cTime >= 0 ? cTime : nowPerf) / 1000;
      const beatFraction = ((audioTime % beatInterval) + beatInterval) % beatInterval / beatInterval;
      const beatPulse = Math.pow(Math.max(0, 1 - beatFraction), 2.6);

      ctx.save();
      if (is3D) {
        const s = this._hitSprites;
        const isLarge = (this.keyStyle !== 'compact');
        const padH = s.padH;
        const yDeckTop = s.yDeckTop;
        const yDeckBot = s.yDeckBot;
        const bottomY = this.height + 30;
        const isRiverHit = Boolean(this.isRiverModeActive || (typeof window !== 'undefined' && window.isRiverModeActive));

        if (isRiverHit) {
          // =========================================================================
          // ZONA PERFECT+ Y CASCADA INFERIOR ("LO DE ABAJO DEL PERFECT") EXCLUSIVAS MODO RÍO
          // =========================================================================
          const activeTimeMs = cTime >= 0 ? cTime : nowPerf;
          const waterfallFlowPos = this._getRiverFlowPos ? this._getRiverFlowPos(activeTimeMs) : activeTimeMs;
          const waterfallPhase = Math.max(0, waterfallFlowPos * 0.0022);
          const waterfallScroll = waterfallPhase % 1.0;

          // 1. LO DE ABAJO DEL PERFECT: GRAN CASCADA 3D Y POZA DE AGUA TURQUESA CON ESPUMA Y FOCA
          const apL_top = this.getLaneBoundaryX(0, yDeckBot) - 18;
          const apR_top = this.getLaneBoundaryX(3, yDeckBot) + 18;
          const apL_bot = this.getLaneBoundaryX(0, bottomY) - 28;
          const apR_bot = this.getLaneBoundaryX(3, bottomY) + 28;

          if (!this._riverApronGrad || this._riverApronGradY !== yDeckBot) {
            this._riverApronGradY = yDeckBot;
            const ag = ctx.createLinearGradient(0, yDeckBot, 0, bottomY);
            ag.addColorStop(0.00, '#022c43');
            ag.addColorStop(0.24, '#0369a1');
            ag.addColorStop(0.55, '#0891b2');
            ag.addColorStop(0.85, '#0e7490');
            ag.addColorStop(1.00, '#042f4b');
            this._riverApronGrad = ag;
          }
          ctx.fillStyle = this._riverApronGrad;
          ctx.beginPath();
          ctx.moveTo(apL_top, yDeckBot);
          ctx.lineTo(apR_top, yDeckBot);
          ctx.lineTo(apR_bot, bottomY);
          ctx.lineTo(apL_bot, bottomY);
          ctx.closePath();
          ctx.fill();

          // Cortinas de agua cayendo en cascada vertical bajo el azud de piedra del Perfect
          const numFalls = 22;
          for (let f = 0; f < numFalls; f++) {
            const frac = (f + 0.5) / numFalls;
            const xTop = apL_top + (apR_top - apL_top) * frac;
            const xBot = apL_bot + (apR_bot - apL_bot) * frac;
            const fallPhase = (waterfallPhase + (f * 0.19)) % 1.0;
            const y0 = yDeckBot + (bottomY - yDeckBot) * (fallPhase * 0.35);
            const y1 = yDeckBot + (bottomY - yDeckBot) * Math.min(1.0, fallPhase * 0.35 + 0.55);
            const x0 = xTop + (xBot - xTop) * ((y0 - yDeckBot) / Math.max(1, bottomY - yDeckBot));
            const x1 = xTop + (xBot - xTop) * ((y1 - yDeckBot) / Math.max(1, bottomY - yDeckBot));

            ctx.strokeStyle = (f % 2 === 0)
              ? 'rgba(224, 242, 254, 0.46)'
              : 'rgba(125, 211, 252, 0.34)';
            ctx.lineWidth = 3.2 + (f % 3) * 1.4;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
          }

          // Nube de espuma blanca hirviente en la base del salto de agua y anillos en la poza inferior
          const foamBaseY = yDeckBot + 14;
          const numFoamPuffs = 15;
          for (let pIdx = 0; pIdx < numFoamPuffs; pIdx++) {
            const frac = pIdx / (numFoamPuffs - 1);
            const fx = apL_top + (apR_top - apL_top) * frac;
            const fy = foamBaseY + Math.sin(activeTimeMs * 0.008 + pIdx * 1.3) * 3.5;
            const rPuff = 12 + (pIdx % 3) * 4 + beatPulse * 3.5;
            ctx.fillStyle = (pIdx % 2 === 0) ? 'rgba(240, 249, 255, 0.78)' : 'rgba(186, 230, 253, 0.62)';
            ctx.beginPath();
            ctx.ellipse(fx, fy, rPuff * 1.25, rPuff * 0.62, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Ondas concéntricas de agua expandiéndose en la poza inferior ("lo de abajo del perfect")
          for (let w = 0; w < 3; w++) {
            const wProg = ((waterfallPhase * 0.65 + w * 0.33) % 1.0);
            const wy = foamBaseY + 12 + wProg * Math.max(24, (this.height - foamBaseY - 8));
            const wL = this.getLaneBoundaryX(0.15, wy);
            const wR = this.getLaneBoundaryX(2.85, wy);
            ctx.strokeStyle = `rgba(224, 242, 254, ${((1 - wProg) * 0.52).toFixed(3)})`;
            ctx.lineWidth = 2.2 * (1 - wProg * 0.4);
            ctx.beginPath();
            ctx.moveTo(wL, wy);
            ctx.quadraticCurveTo((wL + wR) * 0.5, wy + 5 * Math.sin(activeTimeMs * 0.005 + w), wR, wy);
            ctx.stroke();
          }

          // Foca Ultra Realista asomando la cabecita y nadando feliz en la poza de agua bajo el Perfect
          if (this._riverSealBustSprites && this._riverSealBustSprites.length > 0 && (this.height - yDeckBot) > 36) {
            const poolY = Math.min(this.height - 24, yDeckBot + (this.height - yDeckBot) * 0.58);
            const poolX = this.width * 0.5 + Math.sin(activeTimeMs * 0.0014) * (this.width * 0.18);
            const bob = Math.sin(activeTimeMs * 0.0048) * 3.5;
            const sealSz = 56;
            ctx.save();
            ctx.translate(poolX, poolY + bob);
            if (Math.cos(activeTimeMs * 0.0014) < 0) ctx.scale(-1, 1);
            ctx.drawImage(this._riverSealBustSprites[0], -sealSz * 0.5, -sealSz * 0.52, sealSz, sealSz);
            ctx.restore();
          }

          // 2. PRESA / PUENTE NATURAL DE ROCA ESCULPIDA Y MUSGO ESMERALDA (Chasis de la zona Perfect)
          const chMarginTop = 14;
          const chMarginBot = 18;
          const chL_top = this.getLaneBoundaryX(0, yDeckTop) - chMarginTop;
          const chR_top = this.getLaneBoundaryX(3, yDeckTop) + chMarginTop;
          const chL_bot = this.getLaneBoundaryX(0, yDeckBot) - chMarginBot;
          const chR_bot = this.getLaneBoundaryX(3, yDeckBot) + chMarginBot;

          // Labio frontal de roca basáltica mojada sobre el salto de la cascada
          const lipH = isLarge ? 12 : 8;
          const yLipBot = yDeckBot + lipH;
          const chL_lip = this.getLaneBoundaryX(0, yLipBot) - (chMarginBot + 3);
          const chR_lip = this.getLaneBoundaryX(3, yLipBot) + (chMarginBot + 3);
          ctx.fillStyle = '#1e293b';
          this._traceQuadOn(ctx, chL_bot, chR_bot, chL_lip, chR_lip, yDeckBot - 2, yLipBot, 12);
          ctx.fill();
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Cubierta principal de piedra de río tallada con pátina húmeda
          if (!this._riverDeckGrad || this._riverDeckGradY !== yDeckTop) {
            this._riverDeckGradY = yDeckTop;
            const dg = ctx.createLinearGradient(0, yDeckTop, 0, yDeckBot);
            dg.addColorStop(0.00, '#334155');
            dg.addColorStop(0.28, '#1e293b');
            dg.addColorStop(0.70, '#0f172a');
            dg.addColorStop(1.00, '#1e293b');
            this._riverDeckGrad = dg;
          }
          ctx.fillStyle = this._riverDeckGrad;
          this._traceQuadOn(ctx, chL_top, chR_top, chL_bot, chR_bot, yDeckTop, yDeckBot, 14);
          ctx.fill();
          ctx.strokeStyle = `rgba(125, 211, 252, ${(0.48 + beatPulse * 0.25).toFixed(3)})`;
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // Grietas de piedra y parches de musgo húmedo en los extremos y separadores del puente de roca
          ctx.fillStyle = 'rgba(34, 197, 94, 0.55)';
          for (let m = 0; m <= 3; m++) {
            const mx = this.getLaneBoundaryX(m, hitY);
            ctx.beginPath();
            ctx.ellipse(mx, yDeckTop + 6, 10, 4.5, 0, 0, Math.PI * 2);
            ctx.ellipse(mx, yDeckBot - 6, 12, 5.0, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. POZAS RECEPTORAS DE ROCA SUMERGIDA POR CARRIL
          const wellHalfH = padH * 0.46;
          const yWellTop = hitY - wellHalfH;
          const yWellBot = hitY + wellHalfH;
          const wellMargin = isLarge ? 3.8 : 2.8;
          const plateMargin = isLarge ? 6.2 : 4.4;
          const maxSink = isLarge ? 7.0 : 4.5;
          const cornerRad = isLarge ? 12 : 8;

          for (let l = 0; l < 3; l++) {
            const elapsedPress = nowPerf - (this.lanePressAnim ? (this.lanePressAnim[l] || 0) : 0);
            const isTapping = elapsedPress >= 0 && elapsedPress < 260;
            const shockProgress = isTapping ? (elapsedPress / 260) : 0;
            const tapWave = isTapping
              ? (shockProgress < 0.16
                  ? (shockProgress / 0.16)
                  : Math.exp(-((shockProgress - 0.16) / 0.84) * 3.6) * Math.cos(((shockProgress - 0.16) / 0.84) * Math.PI * 1.8))
              : 0;

            const isHolding = this.activeHolds.has(l);
            const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
            const glow = this.laneGlows[l] || 0;
            const isActive = isHolding || flashTimer > 0.01 || glow > 0.18 || (isTapping && elapsedPress < 130);
            const energy = Math.min(1.0, Math.max(
              isHolding ? 1.0 : 0,
              flashTimer > 0 ? Math.min(1.0, flashTimer / 0.15) : 0,
              glow * 0.85,
              isTapping ? Math.max(0, 1 - elapsedPress / 200) : 0
            ));

            const wL_top = this.getLaneBoundaryX(l, yWellTop) + wellMargin;
            const wR_top = this.getLaneBoundaryX(l + 1, yWellTop) - wellMargin;
            const wL_bot = this.getLaneBoundaryX(l, yWellBot) + wellMargin;
            const wR_bot = this.getLaneBoundaryX(l + 1, yWellBot) - wellMargin;

            // Cavidad de agua profunda enmarcada en roca
            ctx.fillStyle = isActive ? '#0369a1' : '#082f49';
            this._traceQuadOn(ctx, wL_top, wR_top, wL_bot, wR_bot, yWellTop, yWellBot, cornerRad);
            ctx.fill();
            ctx.strokeStyle = isActive
              ? `rgba(224, 242, 254, ${(0.75 + energy * 0.25).toFixed(3)})`
              : 'rgba(125, 211, 252, 0.38)';
            ctx.lineWidth = isActive ? 2.2 : 1.4;
            ctx.stroke();

            // Losa receptora de piedra de río flotante que se hunde en el agua al pulsar
            const currentSink = Math.max(-1.8, (isHolding ? maxSink * 0.88 : 0) + (isTapping ? maxSink * tapWave : (glow > 0.22 ? maxSink * 0.50 : 0)));
            const yPlateTop = yWellTop + 3.0 + currentSink * 0.85;
            const yPlateBot = yWellBot - 2.2 + currentSink * 0.42;
            const bevelH = Math.max(3.5, (isLarge ? 8.5 : 5.0) - Math.max(0, currentSink * 0.70));
            const yBevelTop = yPlateBot - bevelH;

            const pL_top = this.getLaneBoundaryX(l, yPlateTop) + plateMargin;
            const pR_top = this.getLaneBoundaryX(l + 1, yPlateTop) - plateMargin;
            const pL_bev = this.getLaneBoundaryX(l, yBevelTop) + plateMargin;
            const pR_bev = this.getLaneBoundaryX(l + 1, yBevelTop) - plateMargin;
            const pL_bot = this.getLaneBoundaryX(l, yPlateBot) + plateMargin;
            const pR_bot = this.getLaneBoundaryX(l + 1, yPlateBot) - plateMargin;
            const plateRad = Math.max(5, cornerRad - 2);

            // Bisel frontal de roca sumergida
            ctx.fillStyle = isActive ? '#0284c7' : '#1e293b';
            this._traceQuadOn(ctx, pL_bev, pR_bev, pL_bot, pR_bot, yBevelTop, yPlateBot, plateRad);
            ctx.fill();

            // Cara superior de baldosa de roca húmeda receptora
            ctx.fillStyle = isActive ? '#38bdf8' : '#334155';
            this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
            ctx.fill();

            if (energy > 0.02) {
              ctx.save();
              ctx.globalCompositeOperation = 'lighter';
              ctx.fillStyle = `rgba(186, 230, 253, ${(energy * 0.45).toFixed(3)})`;
              this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
              ctx.fill();
              ctx.restore();
            }

            // Anillo de espuma blanca perimetral alrededor de la roca receptora
            ctx.strokeStyle = isActive
              ? `rgba(255, 255, 255, ${(0.82 + energy * 0.18).toFixed(3)})`
              : `rgba(186, 230, 253, ${(0.42 + beatPulse * 0.16).toFixed(3)})`;
            ctx.lineWidth = isActive ? 2.2 : 1.4;
            this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
            ctx.stroke();
          }

          // 4. BANDA DE CORRIENTE CRISTALINA PERFECT+ Y ESPUMA VIVA (Atraviesa los 3 carriles)
          const bandHalfH = isLarge ? 12.5 : 8.5;
          const yBandTop = hitY - bandHalfH;
          const yBandBot = hitY + bandHalfH;
          const bandL_top = this.getLaneBoundaryX(0, yBandTop) - 4;
          const bandR_top = this.getLaneBoundaryX(3, yBandTop) + 4;
          const bandL_bot = this.getLaneBoundaryX(0, yBandBot) - 4;
          const bandR_bot = this.getLaneBoundaryX(3, yBandBot) + 4;

          ctx.save();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
          this._traceQuadOn(ctx, bandL_top, bandR_top, bandL_bot, bandR_bot, yBandTop, yBandBot, 7);
          ctx.fill();

          // Crestas onduladas de espuma blanca delimitando la ventana Perfect+
          ctx.strokeStyle = `rgba(224, 242, 254, ${(0.76 + beatPulse * 0.22).toFixed(3)})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          const stepsBand = 24;
          for (let sb = 0; sb <= stepsBand; sb++) {
            const f = sb / stepsBand;
            const waveY = Math.sin(f * Math.PI * 6 - activeTimeMs * 0.008) * 1.6;
            const xT = bandL_top + (bandR_top - bandL_top) * f;
            if (sb === 0) ctx.moveTo(xT, yBandTop + waveY);
            else ctx.lineTo(xT, yBandTop + waveY);
          }
          for (let sb = 0; sb <= stepsBand; sb++) {
            const f = sb / stepsBand;
            const waveY = Math.cos(f * Math.PI * 6 - activeTimeMs * 0.008) * 1.6;
            const xB = bandL_bot + (bandR_bot - bandL_bot) * f;
            if (sb === 0) ctx.moveTo(xB, yBandBot + waveY);
            else ctx.lineTo(xB, yBandBot + waveY);
          }
          ctx.stroke();
          ctx.restore();

          // 5. REMOLINOS DE AGUA PERFECT+, ONDAS DE IMPACTO Y SALPICADURAS POR CARRIL
          for (let l = 0; l < 3; l++) {
            const elapsedPress = nowPerf - (this.lanePressAnim ? (this.lanePressAnim[l] || 0) : 0);
            const isTapping = elapsedPress >= 0 && elapsedPress < 280;
            const shockProgress = isTapping ? (elapsedPress / 280) : 0;
            const isHolding = this.activeHolds.has(l);
            const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
            const glow = this.laneGlows[l] || 0;
            const isActive = isHolding || flashTimer > 0.01 || glow > 0.18 || (isTapping && elapsedPress < 140);
            const energy = Math.min(1.0, Math.max(
              isHolding ? 1.0 : 0,
              flashTimer > 0 ? Math.min(1.0, flashTimer / 0.15) : 0,
              glow * 0.85,
              isTapping ? Math.max(0, 1 - elapsedPress / 220) : 0
            ));

            const bL = this.getLaneBoundaryX(l, hitY) + plateMargin + 4;
            const bR = this.getLaneBoundaryX(l + 1, hitY) - plateMargin - 4;
            const cx = (bL + bR) * 0.5;
            const perfY = hitY;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            // Línea central de corriente de agua luminosa en cada carril
            ctx.strokeStyle = `rgba(56, 189, 248, ${(0.65 + energy * 0.35).toFixed(3)})`;
            ctx.lineWidth = isActive ? 6.2 : 3.8;
            ctx.beginPath();
            ctx.moveTo(bL, perfY);
            ctx.lineTo(bR, perfY);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = isActive ? 2.6 : 1.6;
            ctx.beginPath();
            ctx.moveTo(bL + 4, perfY);
            ctx.lineTo(bR - 4, perfY);
            ctx.stroke();

            // Emblema central de Gota/Remolino de Agua en el centro del receptor
            const dropScale = 1.0 + beatPulse * 0.18 + energy * 0.45;
            const rx = (isLarge ? 13 : 9.5) * dropScale;
            const ry = (isLarge ? 7.2 : 5.2) * dropScale;
            ctx.strokeStyle = 'rgba(186, 230, 253, 0.92)';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.ellipse(cx, perfY, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx, perfY, rx * 0.48, ry * 0.48, 0, 0, Math.PI * 2);
            ctx.fill();

            // Onda de agua triple y corona de salpicadura en el receptor al tocar (Tap Water Splash)
            if (isTapping && shockProgress > 0 && shockProgress < 1.0) {
              const easeOut = 1 - Math.pow(1 - shockProgress, 2.3);
              const alpha = (1 - shockProgress) * 0.95;
              const maxRx = (bR - bL) * 0.56;
              for (let ring = 0; ring < 3; ring++) {
                const rProg = Math.max(0, Math.min(1, easeOut - ring * 0.16));
                if (rProg <= 0) continue;
                const rX = 8 + maxRx * rProg;
                const rY = rX * 0.52;
                ctx.strokeStyle = ring === 0
                  ? `rgba(255, 255, 255, ${alpha.toFixed(3)})`
                  : `rgba(125, 211, 252, ${(alpha * 0.80).toFixed(3)})`;
                ctx.lineWidth = Math.max(1.0, (3.2 - ring * 0.8) * (1 - shockProgress));
                ctx.beginPath();
                ctx.ellipse(cx, perfY, rX, rY, 0, 0, Math.PI * 2);
                ctx.stroke();
              }
            }

            // Remolino de agua viva (Whirlpool Vortex) durante los Holds de troncos de madera
            if (isHolding) {
              const vortexRx = (bR - bL) * 0.38;
              const vortexRy = vortexRx * 0.54;
              const spin = activeTimeMs * 0.011;
              for (let arm = 0; arm < 3; arm++) {
                const a0 = spin + arm * ((Math.PI * 2) / 3);
                ctx.strokeStyle = arm % 2 === 0 ? '#ffffff' : '#7dd3fc';
                ctx.lineWidth = 2.6;
                ctx.beginPath();
                ctx.ellipse(cx, perfY, vortexRx, vortexRy, 0, a0, a0 + Math.PI * 0.95);
                ctx.stroke();
              }
            }

            ctx.restore();
          }

          ctx.restore();
          return;
        }

        // 1. FALDÓN ESCÉNICO INFERIOR EN PERSPECTIVA CÓNICA CON REJILLA ACÚSTICA 3D
        const nLanes = this.numLanes || 3;
        const apL_top = this.getLaneBoundaryX(0, yDeckBot);
        const apR_top = this.getLaneBoundaryX(nLanes, yDeckBot);
        const apL_bot = this.getLaneBoundaryX(0, bottomY);
        const apR_bot = this.getLaneBoundaryX(nLanes, bottomY);
        ctx.fillStyle = s.apronGrad;
        ctx.beginPath();
        ctx.moveTo(apL_top - 14, yDeckBot);
        ctx.lineTo(apR_top + 14, yDeckBot);
        ctx.lineTo(apR_bot + 24, bottomY);
        ctx.lineTo(apL_bot - 24, bottomY);
        ctx.closePath();
        ctx.fill();

        // Líneas de fuga y costillas horizontales en el faldón inferior
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, 0.22)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let l = 1; l < nLanes; l++) {
          ctx.moveTo(this.getLaneBoundaryX(l, yDeckBot), yDeckBot);
          ctx.lineTo(this.getLaneBoundaryX(l, bottomY), bottomY);
        }
        for (let r = 1; r <= 3; r++) {
          const ry = yDeckBot + (bottomY - yDeckBot) * (r * 0.26);
          if (ry < bottomY) {
            ctx.moveTo(this.getLaneBoundaryX(0, ry) - 8, ry);
            ctx.lineTo(this.getLaneBoundaryX(nLanes, ry) + 8, ry);
          }
        }
        ctx.stroke();

        // 2. CONSOLA / CHASIS 3D EN PERSPECTIVA CÓNICA CON LABIO FRONTAL EXTRUIDO
        const chMarginTop = (nLanes === 4) ? 5 : 12;
        const chMarginBot = (nLanes === 4) ? 7 : 16;
        const chL_top = this.getLaneBoundaryX(0, yDeckTop) - chMarginTop;
        const chR_top = this.getLaneBoundaryX(nLanes, yDeckTop) + chMarginTop;
        const chL_bot = this.getLaneBoundaryX(0, yDeckBot) - chMarginBot;
        const chR_bot = this.getLaneBoundaryX(nLanes, yDeckBot) + chMarginBot;

        // A. Pared frontal extruida del puente (3D Front Lip)
        const lipH = isLarge ? 10 : 7;
        const yLipBot = yDeckBot + lipH;
        const chL_lip = this.getLaneBoundaryX(0, yLipBot) - (chMarginBot + 2);
        const chR_lip = this.getLaneBoundaryX(nLanes, yLipBot) + (chMarginBot + 2);
        ctx.fillStyle = s.deckLipGrad;
        this._traceQuadOn(ctx, chL_bot, chR_bot, chL_lip, chR_lip, yDeckBot - 2, yLipBot, 10);
        ctx.fill();
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.40 + beatPulse * 0.25).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // B. Cubierta superior inclinada del puente (3D Perspective Deck)
        ctx.fillStyle = s.deckGrad;
        this._traceQuadOn(ctx, chL_top, chR_top, chL_bot, chR_bot, yDeckTop, yDeckBot, 13);
        ctx.fill();

        // Bisel metálico cromado perimetral del puente 3D
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.38 + beatPulse * 0.28).toFixed(3)})`;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Filamento especular en la arista superior e inferior del puente
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(chL_top + 12, yDeckTop + 1.5);
        ctx.lineTo(chR_top - 12, yDeckTop + 1.5);
        ctx.moveTo(chL_bot + 12, yDeckBot - 1.5);
        ctx.lineTo(chR_bot - 12, yDeckBot - 1.5);
        ctx.stroke();

        // 3. RECEPTORES MECÁNICOS 3D POR CARRIL (Fieles al punto de fuga de la autopista)
        const wellHalfH = padH * 0.46;
        const yWellTop = hitY - wellHalfH;
        const yWellBot = hitY + wellHalfH;
        const wellMargin = (nLanes === 4) ? (isLarge ? 2.0 : 1.5) : (isLarge ? 3.8 : 2.8);
        const plateMargin = (nLanes === 4) ? (isLarge ? 3.4 : 2.5) : (isLarge ? 6.2 : 4.4);
        const maxSink = isLarge ? 7.0 : 4.5;
        const cornerRad = (nLanes === 4) ? (isLarge ? 8 : 5) : (isLarge ? 10 : 6);

        for (let l = 0; l < nLanes; l++) {
          const elapsedPress = nowPerf - (this.lanePressAnim ? (this.lanePressAnim[l] || 0) : 0);
          const isTapping = elapsedPress >= 0 && elapsedPress < 260;
          let tapWave = 0;
          let shockProgress = 0;
          if (isTapping) {
            const t = elapsedPress / 260;
            shockProgress = t;
            tapWave = t < 0.16
              ? (t / 0.16)
              : Math.exp(-((t - 0.16) / 0.84) * 3.6) * Math.cos(((t - 0.16) / 0.84) * Math.PI * 1.8);
          }

          const isHolding = this.activeHolds.has(l);
          const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
          const glow = this.laneGlows[l] || 0;
          const isActive = isHolding || flashTimer > 0.01 || glow > 0.18 || (isTapping && elapsedPress < 130);
          const energy = Math.min(1.0, Math.max(
            isHolding ? 1.0 : 0,
            flashTimer > 0 ? Math.min(1.0, flashTimer / 0.15) : 0,
            glow * 0.85,
            isTapping ? Math.max(0, 1 - elapsedPress / 200) : 0
          ));

          const laneFlashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || laserCol;
          const activeRgb = isActive ? hexToRgb(laneFlashCol) : laserRgb;

          // A. Cavidad receptora profunda (3D Recessed Socket) con paredes interiores visibles
          const wL_top = this.getLaneBoundaryX(l, yWellTop) + wellMargin;
          const wR_top = this.getLaneBoundaryX(l + 1, yWellTop) - wellMargin;
          const wL_bot = this.getLaneBoundaryX(l, yWellBot) + wellMargin;
          const wR_bot = this.getLaneBoundaryX(l + 1, yWellBot) - wellMargin;

          ctx.fillStyle = s.wellGrad;
          this._traceQuadOn(ctx, wL_top, wR_top, wL_bot, wR_bot, yWellTop, yWellBot, cornerRad);
          ctx.fill();

          // Pared interior superior de la cavidad (efecto de profundidad real 3D)
          const yInnerWall = yWellTop + (isLarge ? 6.5 : 4.5);
          const iwL = this.getLaneBoundaryX(l, yInnerWall) + wellMargin + 1.5;
          const iwR = this.getLaneBoundaryX(l + 1, yInnerWall) - wellMargin - 1.5;
          ctx.fillStyle = isActive
            ? `rgba(${Math.round(activeRgb.r * 0.35)}, ${Math.round(activeRgb.g * 0.35)}, ${Math.round(activeRgb.b * 0.35)}, 0.90)`
            : 'rgba(2, 4, 10, 0.92)';
          ctx.beginPath();
          ctx.moveTo(wL_top, yWellTop);
          ctx.lineTo(wR_top, yWellTop);
          ctx.lineTo(iwR, yInnerWall);
          ctx.lineTo(iwL, yInnerWall);
          ctx.closePath();
          ctx.fill();

          // Marco luminoso perimetral de la cavidad
          ctx.strokeStyle = isActive
            ? `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.55 + energy * 0.45).toFixed(3)})`
            : `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.22 + beatPulse * 0.12).toFixed(3)})`;
          ctx.lineWidth = isActive ? 1.8 : 1.2;
          this._traceQuadOn(ctx, wL_top, wR_top, wL_bot, wR_bot, yWellTop, yWellBot, cornerRad);
          ctx.stroke();

          // B. Placa Táctil 3D con compresión de pistón en el plano de perspectiva
          const currentSink = Math.max(-1.8, (isHolding ? maxSink * 0.88 : 0) + (isTapping ? maxSink * tapWave : (glow > 0.22 ? maxSink * 0.50 : 0)));
          const yPlateTop = yWellTop + 3.0 + currentSink * 0.85;
          const yPlateBot = yWellBot - 2.2 + currentSink * 0.42;
          const bevelH = Math.max(3.5, (isLarge ? 8.5 : 5.0) - Math.max(0, currentSink * 0.70));
          const yBevelTop = yPlateBot - bevelH;

          const pL_top = this.getLaneBoundaryX(l, yPlateTop) + plateMargin;
          const pR_top = this.getLaneBoundaryX(l + 1, yPlateTop) - plateMargin;
          const pL_bev = this.getLaneBoundaryX(l, yBevelTop) + plateMargin;
          const pR_bev = this.getLaneBoundaryX(l + 1, yBevelTop) - plateMargin;
          const pL_bot = this.getLaneBoundaryX(l, yPlateBot) + plateMargin;
          const pR_bot = this.getLaneBoundaryX(l + 1, yPlateBot) - plateMargin;
          const plateRad = Math.max(4, cornerRad - 2);

          // Cara frontal 3D (Bisel delantero de la tecla receptora)
          ctx.fillStyle = isActive
            ? `rgba(${Math.round(activeRgb.r * 0.52)}, ${Math.round(activeRgb.g * 0.52)}, ${Math.round(activeRgb.b * 0.52)}, 0.96)`
            : '#090d18';
          this._traceQuadOn(ctx, pL_bev, pR_bev, pL_bot, pR_bot, yBevelTop, yPlateBot, plateRad);
          ctx.fill();

          // Cara superior 3D de la tecla receptora
          ctx.fillStyle = s.plateIdleGrad;
          this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
          ctx.fill();

          // Retroiluminación interna reactiva al impacto o nota mantenida
          if (energy > 0.02) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(energy * 0.36).toFixed(3)})`;
            this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
            ctx.fill();
            ctx.restore();
          }

          // Chevrons guía en escorzo 3D sobre la placa receptora (animados hacia el centro de impacto)
          const chevShift = ((audioTime * 2.2) % 1.0);
          const plateMidXTop = (pL_top + pR_top) * 0.5;
          const plateMidXBot = (pL_bev + pR_bev) * 0.5;
          const chevW = (pR_top - pL_top) * 0.24;
          const chevY = yPlateTop + 5 + chevShift * 5;
          ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.20 + energy * 0.35 + (1 - chevShift) * 0.15).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(plateMidXTop - chevW, chevY - 2.5);
          ctx.lineTo(plateMidXTop, chevY + 1.5);
          ctx.lineTo(plateMidXTop + chevW, chevY - 2.5);
          const chevBotY = yBevelTop - 4 - chevShift * 4;
          ctx.moveTo(plateMidXBot - chevW * 1.05, chevBotY + 2.5);
          ctx.lineTo(plateMidXBot, chevBotY - 1.5);
          ctx.lineTo(plateMidXBot + chevW * 1.05, chevBotY + 2.5);
          ctx.stroke();

          // Borde especular metálico de la placa 3D
          ctx.strokeStyle = isActive
            ? `rgba(255, 255, 255, ${(0.65 + energy * 0.35).toFixed(3)})`
            : `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.28 + beatPulse * 0.16).toFixed(3)})`;
          ctx.lineWidth = isActive ? 1.9 : 1.25;
          this._traceQuadOn(ctx, pL_top, pR_top, pL_bev, pR_bev, yPlateTop, yBevelTop, plateRad);
          ctx.stroke();
        }

        // 4. BANDA HOLOGRÁFICA CONTINUA PERFECT+ EN PERSPECTIVA CÓNICA (Atraviesa todos los carriles)
        const bandHalfH = isLarge ? 12.5 : 8.5;
        const yBandTop = hitY - bandHalfH;
        const yBandBot = hitY + bandHalfH;
        const bandOuterMargin = 4;
        const bandL_top = this.getLaneBoundaryX(0, yBandTop) - bandOuterMargin;
        const bandR_top = this.getLaneBoundaryX(nLanes, yBandTop) + bandOuterMargin;
        const bandL_bot = this.getLaneBoundaryX(0, yBandBot) - bandOuterMargin;
        const bandR_bot = this.getLaneBoundaryX(nLanes, yBandBot) + bandOuterMargin;

        ctx.save();
        // Lente acrílica translúcida continua de la ventana Perfect+
        ctx.fillStyle = s.glassBandGrad;
        this._traceQuadOn(ctx, bandL_top, bandR_top, bandL_bot, bandR_bot, yBandTop, yBandBot, 6);
        ctx.fill();

        // Tinte de energía reactiva en la banda Perfect+
        ctx.fillStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.12 + beatPulse * 0.10).toFixed(3)})`;
        ctx.fill();

        // Bordes superior e inferior de la ventana Perfect+ (delimitan visualmente el área exacta Perfect+)
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.55 + beatPulse * 0.30).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bandL_top + 4, yBandTop);
        ctx.lineTo(bandR_top - 4, yBandTop);
        ctx.moveTo(bandL_bot + 4, yBandBot);
        ctx.lineTo(bandR_bot - 4, yBandBot);
        ctx.stroke();

        // En Modo Carretera: Franja de Línea de Meta Ajedrezada (Checkered Finish Line) sobre la banda Perfect+
        if (this.isHighwayModeActive || (typeof window !== 'undefined' && window.isHighwayModeActive)) {
          const checkCols = 24;
          const midBandY = (yBandTop + yBandBot) * 0.5;
          for (let row = 0; row < 2; row++) {
            const rTop = row === 0 ? yBandTop + 1 : midBandY;
            const rBot = row === 0 ? midBandY : yBandBot - 1;
            const xL0 = this.getLaneBoundaryX(0, rTop);
            const xR0 = this.getLaneBoundaryX(nLanes, rTop);
            const xL1 = this.getLaneBoundaryX(0, rBot);
            const xR1 = this.getLaneBoundaryX(nLanes, rBot);
            for (let col = 0; col < checkCols; col++) {
              const f0 = col / checkCols;
              const f1 = (col + 1) / checkCols;
              ctx.fillStyle = ((row + col) % 2 === 0) ? 'rgba(255, 255, 255, 0.34)' : 'rgba(9, 13, 22, 0.42)';
              ctx.beginPath();
              ctx.moveTo(xL0 + (xR0 - xL0) * f0, rTop);
              ctx.lineTo(xL0 + (xR0 - xL0) * f1, rTop);
              ctx.lineTo(xL1 + (xR1 - xL1) * f1, rBot);
              ctx.lineTo(xL1 + (xR1 - xL1) * f0, rBot);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // Escáner láser sub-superficial sincronizado al BPM que recorre la lente acrílica Perfect+
        const scanPhase = ((audioTime * 0.85) % 1.0);
        const scanFrac = 0.5 + 0.44 * Math.sin(scanPhase * Math.PI * 2);
        const scanXTop = bandL_top + (bandR_top - bandL_top) * scanFrac;
        const scanXBot = bandL_bot + (bandR_bot - bandL_bot) * scanFrac;
        const scanW = 18 + beatPulse * 10 + (this.overdriveLevel || 0) * 14;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.16 + beatPulse * 0.14 + (this.overdriveLevel || 0) * 0.12).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(scanXTop - scanW, yBandTop);
        ctx.lineTo(scanXTop + scanW, yBandTop);
        ctx.lineTo(scanXBot + scanW * 1.15, yBandBot);
        ctx.lineTo(scanXBot - scanW * 1.15, yBandBot);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 5. NÚCLEOS DE PRECISIÓN PERFECT+, CORCHETES Y ANIMACIONES ESPECTACULARES POR CARRIL
        for (let l = 0; l < nLanes; l++) {
          const elapsedPress = nowPerf - (this.lanePressAnim ? (this.lanePressAnim[l] || 0) : 0);
          const isTapping = elapsedPress >= 0 && elapsedPress < 260;
          const shockProgress = isTapping ? (elapsedPress / 260) : 0;
          const tapWave = isTapping
            ? (shockProgress < 0.16
                ? (shockProgress / 0.16)
                : Math.exp(-((shockProgress - 0.16) / 0.84) * 3.6) * Math.cos(((shockProgress - 0.16) / 0.84) * Math.PI * 1.8))
            : 0;

          const isHolding = this.activeHolds.has(l);
          const flashTimer = (Array.isArray(this.laneFlashTimers) && this.laneFlashTimers[l]) || 0;
          const glow = this.laneGlows[l] || 0;
          const isActive = isHolding || flashTimer > 0.01 || glow > 0.18 || (isTapping && elapsedPress < 130);
          const energy = Math.min(1.0, Math.max(
            isHolding ? 1.0 : 0,
            flashTimer > 0 ? Math.min(1.0, flashTimer / 0.15) : 0,
            glow * 0.85,
            isTapping ? Math.max(0, 1 - elapsedPress / 200) : 0
          ));

          const laneFlashCol = (Array.isArray(this.laneFlashColors) && this.laneFlashColors[l]) || laserCol;
          const activeRgb = isActive ? hexToRgb(laneFlashCol) : laserRgb;

          const currentSink = Math.max(-1.8, (isHolding ? maxSink * 0.88 : 0) + (isTapping ? maxSink * tapWave : (glow > 0.22 ? maxSink * 0.50 : 0)));
          const perfY = hitY + currentSink * 0.55;
          const cBandTop = perfY - (isLarge ? 10.5 : 7.5);
          const cBandBot = perfY + (isLarge ? 10.5 : 7.5);
          const bandInset = plateMargin + ((nLanes === 4) ? 2.0 : 3.5);

          // Expansión elástica de los corchetes al impactar
          const brkRecoil = (isTapping ? Math.sin(Math.min(1, shockProgress * 2.2) * Math.PI) * 4.5 : 0) + (isHolding ? 2.5 : 0);
          const bL_top = this.getLaneBoundaryX(l, cBandTop) + bandInset - brkRecoil;
          const bR_top = this.getLaneBoundaryX(l + 1, cBandTop) - bandInset + brkRecoil;
          const bL_bot = this.getLaneBoundaryX(l, cBandBot) + bandInset - brkRecoil;
          const bR_bot = this.getLaneBoundaryX(l + 1, cBandBot) - bandInset + brkRecoil;
          const cx = (bL_top + bR_top + bL_bot + bR_bot) * 0.25;

          ctx.save();
          // A. Resplandor localizado de ventana Perfect+ cuando el carril está activo
          if (energy > 0.01) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.22 + energy * 0.36).toFixed(3)})`;
            this._traceQuadOn(ctx, bL_top, bR_top, bL_bot, bR_bot, cBandTop, cBandBot, 5);
            ctx.fill();
          }

          // B. Corchetes de bloqueo en perspectiva cónica [   ] con rebote táctil
          const brkLen = Math.max(9, (bR_bot - bL_bot) * 0.19);
          ctx.strokeStyle = isActive
            ? '#ffffff'
            : `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.78 + beatPulse * 0.22).toFixed(3)})`;
          ctx.lineWidth = isActive ? 2.5 : 1.7;
          ctx.beginPath();
          // Corchete izquierdo alineado a la pendiente del carril
          ctx.moveTo(bL_top + brkLen, cBandTop);
          ctx.lineTo(bL_top, cBandTop);
          ctx.lineTo(bL_bot, cBandBot);
          ctx.lineTo(bL_bot + brkLen, cBandBot);
          // Corchete derecho alineado a la pendiente del carril
          ctx.moveTo(bR_top - brkLen, cBandTop);
          ctx.lineTo(bR_top, cBandTop);
          ctx.lineTo(bR_bot, cBandBot);
          ctx.lineTo(bR_bot - brkLen, cBandBot);
          ctx.stroke();

          // C. Haz Láser Central Perfect+ y Retícula Diamante 3D en Escorzo
          ctx.globalCompositeOperation = 'lighter';
          const coreL = (bL_top + bL_bot) * 0.5 + 3;
          const coreR = (bR_top + bR_bot) * 0.5 - 3;

          // Halo exterior del láser del carril
          ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.58 + energy * 0.42 + beatPulse * 0.20).toFixed(3)})`;
          ctx.lineWidth = isActive ? 6.0 : 3.8;
          ctx.beginPath();
          ctx.moveTo(coreL, perfY);
          ctx.lineTo(coreR, perfY);
          ctx.stroke();

          // Filamento central incandescente
          ctx.strokeStyle = `rgba(255, 255, 255, ${(0.84 + energy * 0.16).toFixed(3)})`;
          ctx.lineWidth = isActive ? 2.5 : 1.6;
          ctx.beginPath();
          ctx.moveTo(coreL + 3, perfY);
          ctx.lineTo(coreR - 3, perfY);
          ctx.stroke();

          // Emblema Prisma / Diamante 3D en el centro del carril (achatado en Y por perspectiva cónica)
          const prismScale = 1.0 + beatPulse * 0.18 + energy * 0.48;
          const rx = (isLarge ? 12.0 : 8.5) * prismScale;
          const ry = (isLarge ? 6.6 : 4.8) * prismScale;

          // Anillo exterior del prisma
          ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.70 + energy * 0.30).toFixed(3)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx, perfY - ry * 1.32);
          ctx.lineTo(cx + rx * 1.32, perfY);
          ctx.lineTo(cx, perfY + ry * 1.32);
          ctx.lineTo(cx - rx * 1.32, perfY);
          ctx.closePath();
          ctx.stroke();

          // Cuerpo del prisma energético
          ctx.fillStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${(0.80 + energy * 0.20).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(cx, perfY - ry);
          ctx.lineTo(cx + rx, perfY);
          ctx.lineTo(cx, perfY + ry);
          ctx.lineTo(cx - rx, perfY);
          ctx.closePath();
          ctx.fill();

          // Núcleo de diamante blanco puro
          const irx = rx * 0.52;
          const iry = ry * 0.52;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx, perfY - iry);
          ctx.lineTo(cx + irx, perfY);
          ctx.lineTo(cx, perfY + iry);
          ctx.lineTo(cx - irx, perfY);
          ctx.closePath();
          ctx.fill();

          // Emblema extra en el Altar Perfect+ exclusivo cuando Singularidad Astral (Trascendental) está equipado
          if (this.activeEffect === 'astral_transcendence') {
            ctx.strokeStyle = `rgba(253, 224, 71, ${(0.68 + beatPulse * 0.30).toFixed(3)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(cx, perfY, rx * 1.75, ry * 1.65, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // D. ANIMACIÓN DE IMPACTO: Doble Onda de Choque Trapezoidal 3D + Barrido de Luz Ascendente + Destello Anamórfico
          if (isTapping && shockProgress > 0 && shockProgress < 1.0) {
            const easeOut = 1 - Math.pow(1 - shockProgress, 2.5);
            const shockAlpha = (1 - shockProgress) * 0.90;
            const expandX = easeOut * 14;
            const expandY = easeOut * 11;

            const wL_top = this.getLaneBoundaryX(l, yWellTop) + wellMargin;
            const wR_top = this.getLaneBoundaryX(l + 1, yWellTop) - wellMargin;
            const wL_bot = this.getLaneBoundaryX(l, yWellBot) + wellMargin;
            const wR_bot = this.getLaneBoundaryX(l + 1, yWellBot) - wellMargin;

            // Onda exterior trapezoidal alineada al carril
            ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${shockAlpha.toFixed(3)})`;
            ctx.lineWidth = Math.max(1.0, 3.4 * (1 - shockProgress));
            this._traceQuadOn(
              ctx,
              wL_top - expandX * 0.85,
              wR_top + expandX * 0.85,
              wL_bot - expandX * 1.05,
              wR_bot + expandX * 1.05,
              yWellTop - expandY,
              yWellBot + expandY,
              cornerRad + 4
            );
            ctx.stroke();

            // Segunda onda interior desfasada en blanco brillante
            if (shockProgress > 0.08) {
              const p2 = (shockProgress - 0.08) / 0.92;
              const ease2 = 1 - Math.pow(1 - p2, 2.2);
              const ex2 = ease2 * 8;
              const ey2 = ease2 * 6;
              ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - p2) * 0.75).toFixed(3)})`;
              ctx.lineWidth = Math.max(0.8, 2.0 * (1 - p2));
              this._traceQuadOn(ctx, bL_top - ex2, bR_top + ex2, bL_bot - ex2, bR_bot + ex2, cBandTop - ey2, cBandBot + ey2, 6);
              ctx.stroke();
            }

            // Destello horizontal anamórfico en la línea Perfect+
            const flareHalfW = ((coreR - coreL) * 0.65) * (0.5 + easeOut * 0.75);
            const flareH = Math.max(1.5, 5.8 * (1 - shockProgress));
            ctx.fillStyle = `rgba(255, 255, 255, ${(shockAlpha * 0.95).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(cx - flareHalfW, perfY);
            ctx.lineTo(cx, perfY - flareH);
            ctx.lineTo(cx + flareHalfW, perfY);
            ctx.lineTo(cx, perfY + flareH);
            ctx.closePath();
            ctx.fill();

            // Onda de Choque con Refracción Cristalina (Aberración Cromática Prismática 3D en el Acrílico)
            const refRx = ((bR_bot - bL_bot) * 0.22) + easeOut * ((bR_bot - bL_bot) * 0.52);
            const refRy = refRx * 0.44;
            if (ctx.ellipse) {
              // Canal Cian (Desfase exterior)
              ctx.strokeStyle = `rgba(0, 242, 254, ${(shockAlpha * 0.78).toFixed(3)})`;
              ctx.lineWidth = Math.max(1.0, 2.6 * (1 - shockProgress));
              ctx.beginPath();
              ctx.ellipse(cx - 2.2 * (1 - shockProgress), perfY, refRx * 1.05, refRy * 1.05, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Canal Magenta (Desfase interior)
              ctx.strokeStyle = `rgba(255, 0, 127, ${(shockAlpha * 0.72).toFixed(3)})`;
              ctx.lineWidth = Math.max(1.0, 2.2 * (1 - shockProgress));
              ctx.beginPath();
              ctx.ellipse(cx + 2.2 * (1 - shockProgress), perfY, refRx * 0.94, refRy * 0.94, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Destello especular diamante central
              ctx.strokeStyle = `rgba(255, 255, 255, ${(shockAlpha * 0.90).toFixed(3)})`;
              ctx.lineWidth = Math.max(0.8, 1.8 * (1 - shockProgress));
              ctx.beginPath();
              ctx.ellipse(cx, perfY, refRx, refRy, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }

          // E. ANIMACIÓN DE NOTA MANTENIDA (HOLD): Reactor de Plasma Elíptico en Perspectiva 3D
          if (isHolding) {
            const active = this.activeHolds.get(l);
            const startT = active.startTime;
            const endT = active.note.end_timestamp_ms || (startT + (active.note.duration_ms || 700));
            const progress = Math.min(1.0, Math.max(0, (cTime - startT) / Math.max(1, endT - startT)));

            const ringRx = (bR_bot - bL_bot) * 0.36;
            const ringRy = ringRx * 0.54; // Escorzo cónico 3D exacto del plano de la pista

            // Onda de compresión concéntrica hacia el núcleo del reactor
            const inWave = 1.0 - ((nowPerf * 0.0035) % 1.0);
            ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, ${((1 - inWave) * 0.65).toFixed(3)})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            if (ctx.ellipse) {
              ctx.ellipse(cx, perfY, ringRx * (0.4 + inWave * 0.9), ringRy * (0.4 + inWave * 0.9), 0, 0, Math.PI * 2);
            }
            ctx.stroke();

            // Anillo base en perspectiva 3D
            ctx.strokeStyle = `rgba(${activeRgb.r}, ${activeRgb.g}, ${activeRgb.b}, 0.42)`;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            if (ctx.ellipse) {
              ctx.ellipse(cx, perfY, ringRx, ringRy, 0, 0, Math.PI * 2);
            } else {
              ctx.arc(cx, perfY, ringRy, 0, Math.PI * 2);
            }
            ctx.stroke();

            // Arco de carga progresiva incandescente en perspectiva
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            if (ctx.ellipse) {
              ctx.ellipse(cx, perfY, ringRx, ringRy, 0, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            } else {
              ctx.arc(cx, perfY, ringRy, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            }
            ctx.stroke();

            // Nodos orbitales giratorios en el plano 3D de la tecla
            const orbitAngle = nowPerf * 0.009;
            for (let n = 0; n < 3; n++) {
              const a = orbitAngle + n * ((Math.PI * 2) / 3);
              const nx = cx + Math.cos(a) * ringRx;
              const ny = perfY + Math.sin(a) * ringRy;
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(nx, ny, 3.0, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          ctx.restore();
        }

        // 6. EMISORES LÁSER LATERALES 3D Y LÍNEA HORIZONTE DE PRECISIÓN PERFECT+
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lineL = this.getLaneBoundaryX(0, hitY) - 12;
        const lineR = this.getLaneBoundaryX(nLanes, hitY) + 12;

        // Haz láser continuo que une los carriles y los emisores exteriores
        ctx.strokeStyle = `rgba(${laserRgb.r}, ${laserRgb.g}, ${laserRgb.b}, ${(0.48 + beatPulse * 0.32).toFixed(3)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(lineL, hitY);
        ctx.lineTo(lineR, hitY);
        ctx.stroke();

        // Nodos divisores luminosos sobre las separaciones de carril
        for (let div = 1; div < nLanes; div++) {
          const divX = this.getLaneBoundaryX(div, hitY);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(divX, hitY - 5);
          ctx.lineTo(divX + 3.5, hitY);
          ctx.lineTo(divX, hitY + 5);
          ctx.lineTo(divX - 3.5, hitY);
          ctx.closePath();
          ctx.fill();
        }

        // Cabezales Emisores Láser 3D en los extremos izquierdo y derecho de la zona Perfect+
        const podW = 10 + beatPulse * 3.0;
        const podH = 9 + beatPulse * 2.0;
        ctx.fillStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.92)`;
        ctx.beginPath();
        // Emisor Izquierdo apuntando hacia el centro de la pista
        ctx.moveTo(lineL - podW, hitY - podH * 0.45);
        ctx.lineTo(lineL + 3, hitY - podH);
        ctx.lineTo(lineL + 6, hitY);
        ctx.lineTo(lineL + 3, hitY + podH);
        ctx.lineTo(lineL - podW, hitY + podH * 0.45);
        ctx.closePath();
        // Emisor Derecho apuntando hacia el centro de la pista
        ctx.moveTo(lineR + podW, hitY - podH * 0.45);
        ctx.lineTo(lineR - 3, hitY - podH);
        ctx.lineTo(lineR - 6, hitY);
        ctx.lineTo(lineR - 3, hitY + podH);
        ctx.lineTo(lineR + podW, hitY + podH * 0.45);
        ctx.closePath();
        ctx.fill();

        // Núcleo blanco de los emisores laterales
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lineL, hitY, 2.8, 0, Math.PI * 2);
        ctx.arc(lineR, hitY, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else {
        // Modo 2D
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, hitY); ctx.lineTo(this.width, hitY);
        ctx.stroke();
      }
      ctx.restore();
    }

    renderVectorChevron(ctx, x, y, direction, maxW = 50, maxH = 30) {
      ctx.save();
      let angle = 0;
      if (direction === 'down') angle = Math.PI;
      else if (direction === 'left') angle = -Math.PI / 2;
      else if (direction === 'right') angle = Math.PI / 2;

      ctx.translate(x, y);
      ctx.rotate(angle);

      const arrowW = Math.max(16, ((maxW > 0 ? maxW : 60) * 0.52));
      const arrowH = Math.max(14, ((maxH > 0 ? maxH : 35) * 0.55));
      const headH = arrowH * 0.55;
      const stemW = arrowW * 0.42;

      ctx.beginPath();
      ctx.moveTo(0, -arrowH / 2);
      ctx.lineTo(arrowW / 2, -arrowH / 2 + headH);
      ctx.lineTo(stemW / 2, -arrowH / 2 + headH);
      ctx.lineTo(stemW / 2, arrowH / 2);
      ctx.lineTo(-stemW / 2, arrowH / 2);
      ctx.lineTo(-stemW / 2, -arrowH / 2 + headH);
      ctx.lineTo(-arrowW / 2, -arrowH / 2 + headH);
      ctx.closePath();

      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    renderNotes(currentTime) {
      const ctx = this.ctx;
      const len = this.notes.length;
      const scrollDur = (Number.isFinite(this.scrollDurationMs) && this.scrollDurationMs > 0) ? this.scrollDurationMs : 1400;
      const invScrollDur = 1.0 / scrollDur;
      const is3D = (this.visualDimension !== '2d');
      const isLarge = (this.keyStyle !== 'compact');
      const hitY = Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84);
      const horizonY = 12;
      const spanY = hitY - horizonY;

      while (this.firstActiveNoteIndex < len) {
        const pastN = this.notes[this.firstActiveNoteIndex];
        if (!pastN) { this.firstActiveNoteIndex++; continue; }
        const pastT = (pastN._echoTargetNote ? pastN._echoTargetNote.timestamp_ms : 0) || pastN.end_timestamp_ms || pastN.timestamp_ms || pastN.timeMs || 0;
        if ((pastN.hit || pastN.missed || pastN.processed || pastN.holdCompleted) && !pastN.holding && (currentTime - pastT > 400)) {
          this.firstActiveNoteIndex++;
        } else {
          break;
        }
      }

      const startIdx = Math.min(this.firstActiveNoteIndex, len);
      const isKaraokeActive = Boolean((typeof window !== 'undefined' && window.isKaraokeModeActive) || this.isKaraokeModeActive);
      const isMushroomActive = Boolean((typeof window !== 'undefined' && window.isMushroomModeActive) || this.isMushroomModeActive);
      const isHighwayActive = Boolean((typeof window !== 'undefined' && window.isHighwayModeActive) || this.isHighwayModeActive);
      const isAnnoyingDogActive = Boolean((typeof window !== 'undefined' && window.isAnnoyingDogModeActive) || this.isAnnoyingDogModeActive);
      const isRiverActive = Boolean((typeof window !== 'undefined' && window.isRiverModeActive) || this.isRiverModeActive);
      const isEchoActive = Boolean((typeof window !== 'undefined' && window.isEchoModeActive) || this.isEchoModeActive);
      const curRiverFlowPos = isRiverActive ? this._getRiverFlowPos(currentTime) : 0;

      if (isHighwayActive) {
        if (!this._hwAssetsReady) {
          this.initHighwayModeAssets();
          this._prepareHighwayTrafficChoreography();
        } else if (len > 0 && !this.notes[0]._hwVehicleType) {
          this._prepareHighwayTrafficChoreography();
        }

        // En Modo Carretera los vehículos tienen distintas velocidades (_hwDurationMs) y se adelantan,
        // usando un pool pre-asignado para 0 allocs de memoria por fotograma (0 tirones de GC)
        const maxLookaheadMs = Math.max(5200, scrollDur * 3.4);
        if (!this._hwVisiblePool) this._hwVisiblePool = [];
        if (!this._hwVisibleList) this._hwVisibleList = [];
        const visibleHighwayItems = this._hwVisibleList;
        visibleHighwayItems.length = 0;
        let poolIdx = 0;

        for (let i = startIdx; i < len; i++) {
          const note = this.notes[i];
          if (!note || note.holdCompleted) continue;
          if (note.hit && note.type !== 'hold') continue;
          if (note.missed && !note.holding) continue;
          if (note.processed && !note.holding) continue;

          const lane = Math.max(0, Math.min(2, Math.round(note.lane ?? 0)));
          const noteT = note.timestamp_ms ?? note.timeMs ?? 0;
          const isBeingHeld = Boolean(note.holding && !note.holdCompleted);
          const timeUntilHit = noteT - currentTime;

          if (timeUntilHit > maxLookaheadMs) break;

          const noteDur = note._hwDurationMs || scrollDur;
          const pHead = 1.0 - (timeUntilHit / noteDur);
          // No ocultar holds cuya cabeza ya cruzó p=1.22 mientras su cola (vagones) siga en pantalla
          if (pHead < -0.15 || (!isBeingHeld && note.type !== 'hold' && pHead > 1.22)) continue;

          const isFlyingNow = Boolean(
            note._hwIsFlyingOvertake &&
            note._hwOvertakeP > 0 &&
            pHead >= (note._hwOvertakeP - 0.24) &&
            pHead <= (note._hwOvertakeP + 0.22)
          );
          let slot = this._hwVisiblePool[poolIdx++];
          if (!slot) {
            slot = { note: null, i: 0, lane: 0, noteT: 0, isBeingHeld: false, pHead: 0, sortOrder: 0 };
            this._hwVisiblePool.push(slot);
          }
          slot.note = note;
          slot.i = i;
          slot.lane = lane;
          slot.noteT = noteT;
          slot.isBeingHeld = isBeingHeld;
          slot.pHead = pHead;
          slot.sortOrder = (isFlyingNow ? 10.0 : 0.0) + pHead;
          visibleHighwayItems.push(slot);
        }

        if (visibleHighwayItems.length > 1) {
          visibleHighwayItems.sort((a, b) => a.sortOrder - b.sortOrder);
        }

        for (let k = 0; k < visibleHighwayItems.length; k++) {
          const item = visibleHighwayItems[k];
          const note = item.note;
          const lane = item.lane;
          const pHead = item.pHead;
          const isBeingHeld = item.isBeingHeld;
          const nextDiff = note.nextSameLaneDiffMs ?? Infinity;
          const coord = this.getPerspectiveCoord(lane, pHead, this._coordScratch0);
          const maxH3D = nextDiff < scrollDur ? Math.max(26, ((nextDiff * invScrollDur) * spanY * coord.scale) - 8) : Infinity;

          if (note.type === 'hold') {
            const rawDur = Number.isFinite(note.duration_ms)
              ? note.duration_ms
              : (Number.isFinite(note.holdDuration)
                  ? (note.holdDuration > 50 ? note.holdDuration : note.holdDuration * 1000)
                  : (Number.isFinite(note.duration) ? (note.duration > 50 ? note.duration : note.duration * 1000) : 700));
            const holdDuration = Math.max(150, Number.isFinite(rawDur) ? rawDur : 700);
            const endT = Number.isFinite(note.end_timestamp_ms) ? note.end_timestamp_ms : (item.noteT + holdDuration);
            this._renderHighwaySteamTrainHold(ctx, note, lane, currentTime, pHead, endT, isBeingHeld, maxH3D);
          } else {
            this._renderHighwayVehicleNote(ctx, note, item.i, lane, currentTime, pHead, maxH3D);
          }
        }
        return;
      }

      for (let i = startIdx; i < len; i++) {
        const note = this.notes[i];
        if (!note || note.holdCompleted) continue;
        if (note.hit && note.type !== 'hold') continue;
        if (note.missed && !note.holding) continue;
        if (note.processed && !note.holding) continue;

        const maxLaneIdx = (this.numLanes || 3) - 1;
        const lane = Math.max(0, Math.min(maxLaneIdx, Math.round(note.lane ?? 0)));
        const noteT = note.timestamp_ms ?? note.timeMs ?? 0;
        const isBeingHeld = Boolean(note.holding && !note.holdCompleted);
        const timeUntilHit = noteT - currentTime;

        if (isEchoActive && note._isEchoRebound) {
          if (!note._echoBounceLaunched) {
            if (currentTime >= (note._echoSourceTimeMs || 0) + 45) {
              this._launchEchoRebound(note._echoSourceNote || { lane: note._echoFromLane ?? lane, timestamp_ms: note._echoSourceTimeMs || (noteT - 450), _echoTargetNote: note }, note._echoSourceTimeMs || (noteT - 450), null, hitY, true);
            } else {
              continue;
            }
          }
          const lyricEcho = isKaraokeActive ? note._cleanLyric : null;
          this.renderEchoBouncingNote(ctx, note, currentTime, hitY, isLarge, lyricEcho);
          continue;
        }

        if (timeUntilHit > (isRiverActive ? 2400 : 1200) && timeUntilHit > scrollDur * (isRiverActive ? 1.65 : 1.0)) break;

        // En Modo Río Rápido, la distancia visual viene dada por el caudal acumulado F(t):
        // ¡Los 3 carriles aceleran y frenan exactamente al mismo tiempo según la densidad de la sección!
        const noteFlowPos = (note._riverFlowPos !== undefined) ? note._riverFlowPos : (isRiverActive ? this._getRiverFlowPos(noteT) : 0);
        const pHead = isRiverActive
          ? (1.0 - (noteFlowPos - curRiverFlowPos) * invScrollDur)
          : (1.0 - timeUntilHit * invScrollDur);
        // Para notas hold, no descartar por pHead > 1.25 mientras su cola siga en pantalla
        if (pHead < -0.15 || (!isBeingHeld && note.type !== 'hold' && pHead > 1.25)) continue;

        // En Modo Setas Alucinógenas o Modo Perro Molesto (Zarpazo que cambia la tecla de carril):
        let drawLane = lane;
        let mushHeightMult = 1.0;
        if (isMushroomActive && note.type !== 'hold') {
          const fromL = (note._mushFromLane !== undefined) ? note._mushFromLane : lane;
          if (fromL !== lane && pHead < 0.54) {
            const swapT = Math.max(0, Math.min(1, (pHead - 0.06) / 0.46));
            const easeSwap = 0.5 - 0.5 * Math.cos(Math.PI * swapT);
            drawLane = fromL + (lane - fromL) * easeSwap;
          } else if (pHead < 0.72) {
            // Oscilación ebria sutil del carril antes de llegar a la zona de golpeo
            drawLane = Math.max(0, Math.min(2, lane + Math.sin(currentTime * 0.007 + (note._mushPhase || 0)) * 0.11 * (1 - pHead)));
          }
          mushHeightMult = 1.0 + Math.sin(currentTime * 0.009 + (note._mushPhase || 0)) * 0.25;
        } else if (isAnnoyingDogActive && note._dogBatted && note.type !== 'hold') {
          const fromL = (note._dogFromLane !== undefined) ? note._dogFromLane : lane;
          const swipeP = note._dogSwipeP || 0.40;
          if (pHead < swipeP) {
            drawLane = fromL;
          } else if (pHead < swipeP + 0.15) {
            const u = (pHead - swipeP) / 0.15;
            // Curva elástica de impacto por el zarpazo del Pomeranian
            const easeBat = 1 - Math.pow(1 - u, 3);
            drawLane = fromL + (lane - fromL) * easeBat;
          } else {
            drawLane = lane;
          }
        }

        const nextDiff = note.nextSameLaneDiffMs ?? Infinity;
        const coord = this.getPerspectiveCoord(drawLane, pHead, this._coordScratch0);
        const maxH3D = nextDiff < scrollDur ? Math.max(26, ((nextDiff * invScrollDur) * spanY * coord.scale) - 8) : Infinity;
        const lyricForNote = isKaraokeActive ? note._cleanLyric : null;

        // ==========================================
        // 1. NOTAS HOLD (ONDA SINUSOIDAL + FILAMENTO DE PLASMA O TRONCO DE MADERA EN MODO RÍO)
        // ==========================================
        if (note.type === 'hold') {
          const rawDur = Number.isFinite(note.duration_ms)
            ? note.duration_ms
            : (Number.isFinite(note.holdDuration)
                ? (note.holdDuration > 50 ? note.holdDuration : note.holdDuration * 1000)
                : (Number.isFinite(note.duration) ? (note.duration > 50 ? note.duration : note.duration * 1000) : 700));
          const holdDuration = Math.max(150, Number.isFinite(rawDur) ? rawDur : 700);
          const endT = Number.isFinite(note.end_timestamp_ms) ? note.end_timestamp_ms : (noteT + holdDuration);

          let currentHeadP = isBeingHeld ? 1.0 : pHead;
          const noteEndFlowPos = (note._riverFlowEndPos !== undefined) ? note._riverFlowEndPos : (isRiverActive ? this._getRiverFlowPos(endT) : 0);
          let currentTailP = isRiverActive
            ? (1.0 - (noteEndFlowPos - curRiverFlowPos) * invScrollDur)
            : (1.0 - (endT - currentTime) * invScrollDur);

          if (currentTailP > 1.25 || currentHeadP < -0.2) continue;

          if (isRiverActive) {
            this._renderRiverWoodenLogHold(ctx, note, lane, currentTime, pHead, currentTailP, isBeingHeld, maxH3D);
            continue;
          }

          ctx.save();

          const segments = 10;
          const stringPoints = this._holdPointsBuffer || [];
          const timeSec = currentTime * 0.001;
          for (let s = 0; s <= segments; s++) {
            const frac = s / segments;
            const pStep = currentTailP + (currentHeadP - currentTailP) * frac;
            const ptCoord = this.getPerspectiveCoord(lane, pStep, this._coordScratch1);

            const standingEnvelope = Math.sin(Math.PI * frac);
            const vibration = isBeingHeld 
              ? (Math.sin(timeSec * 30.0 + ptCoord.y * 0.10) * (6.0 * standingEnvelope * ptCoord.scale))
              : (Math.sin(timeSec * 6.0 + ptCoord.y * 0.05) * (1.2 * standingEnvelope * ptCoord.scale));

            const wave = Math.sin((ptCoord.y * 0.04) - (currentTime * 0.008)) * (2.4 * ptCoord.scale);
            const halfW = Math.max(4, (ptCoord.laneW * ((this.numLanes === 4) ? 0.44 : 0.40)) + wave);

            let pt = stringPoints[s];
            if (!pt) {
              pt = { x: 0, y: 0, scale: 1, laneW: 50, halfW: 20 };
              stringPoints[s] = pt;
            }
            pt.x = ptCoord.x + vibration;
            pt.y = ptCoord.y;
            pt.scale = ptCoord.scale;
            pt.laneW = ptCoord.laneW;
            pt.halfW = halfW;
          }

          // 1. Cinta Hold 100% Opaca y Ultra-Saturada (Máximo contraste sobre la pista blanca 3D)
          const LANE_HOLD_THEMES = this._laneHoldThemes || (this._laneHoldThemes = [
            { body: '#0066ff', mid: '#00c8ff', rail: '#0044cc', rim: '#04081c' }, // Carril 0: Azul/Cian Eléctrico Saturado
            { body: '#d9006c', mid: '#ff1a8c', rail: '#99004d', rim: '#1c0412' }, // Carril 1: Magenta/Rubí Neón Saturado
            { body: '#7c00ff', mid: '#b833ff', rail: '#4d0099', rim: '#110420' }, // Carril 2: Violeta/Amatista Eléctrico Saturado
            { body: '#00b862', mid: '#00f5a0', rail: '#007a40', rim: '#041c10' }  // Carril 3: Esmeralda/Lima Eléctrico Saturado
          ]);
          const hTheme = LANE_HOLD_THEMES[lane % LANE_HOLD_THEMES.length];
          const holdCol = isBeingHeld ? '#00d67f' : hTheme.body;
          const holdMid = isBeingHeld ? '#00ff9d' : hTheme.mid;
          const holdGlow = isBeingHeld ? '#00a862' : hTheme.rail;

          ctx.save();
          // Todo el cuerpo del Hold se dibuja en source-over con opacidad 1.0 (sin transparencia ni blanqueo lighter)
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;

          // A1. Carcasa exterior oscura sólida (100% opaca) para contraste absoluto sobre pista blanca
          const borderPad = 3.5;
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x - pt.halfW - borderPad, pt.y);
            else ctx.lineTo(pt.x - pt.halfW - borderPad, pt.y);
          }
          for (let s = segments; s >= 0; s--) {
            const pt = stringPoints[s];
            ctx.lineTo(pt.x + pt.halfW + borderPad, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = hTheme.rim;
          ctx.fill();

          // A2. Cuerpo principal 100% opaco y profundamente saturado
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x - pt.halfW, pt.y);
            else ctx.lineTo(pt.x - pt.halfW, pt.y);
          }
          for (let s = segments; s >= 0; s--) {
            const pt = stringPoints[s];
            ctx.lineTo(pt.x + pt.halfW, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = holdCol;
          ctx.fill();

          // A3. Banda interior saturada de alto brillo (sin transparencia)
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            const innerW = pt.halfW * 0.62;
            if (s === 0) ctx.moveTo(pt.x - innerW, pt.y);
            else ctx.lineTo(pt.x - innerW, pt.y);
          }
          for (let s = segments; s >= 0; s--) {
            const pt = stringPoints[s];
            const innerW = pt.halfW * 0.62;
            ctx.lineTo(pt.x + innerW, pt.y);
          }
          ctx.closePath();
          ctx.fillStyle = holdMid;
          ctx.fill();

          // B. Raíles laterales sólidos de alta saturación
          ctx.strokeStyle = holdGlow;
          ctx.lineWidth = Math.max(2.5, 4.4 * stringPoints[segments].scale);
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x - pt.halfW, pt.y);
            else ctx.lineTo(pt.x - pt.halfW, pt.y);
          }
          for (let s = 0; s <= segments; s++) {
            const pt = stringPoints[s];
            if (s === 0) ctx.moveTo(pt.x + pt.halfW, pt.y);
            else ctx.lineTo(pt.x + pt.halfW, pt.y);
          }
          ctx.stroke();

          // C. Espina dorsal central con borde de contraste y núcleo blanco puro
          ctx.strokeStyle = hTheme.rim;
          ctx.lineWidth = Math.max(3.5, 6.8 * stringPoints[segments].scale);
          ctx.beginPath();
          for (let s = 0; s <= segments; s++) {
            if (s === 0) ctx.moveTo(stringPoints[s].x, stringPoints[s].y);
            else ctx.lineTo(stringPoints[s].x, stringPoints[s].y);
          }
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2.0, 3.4 * stringPoints[segments].scale);
          ctx.stroke();

          // D. Pulsos de energía sólidos viajando a lo largo del Hold
          const pulseCycle = (currentTime * 0.003) % 1.0;
          for (let pIdx = 0; pIdx < 3; pIdx++) {
            const pFrac = (pulseCycle + pIdx * 0.33) % 1.0;
            const ptIdx = Math.min(stringPoints.length - 1, Math.floor(pFrac * (stringPoints.length - 1)));
            const pulsePt = stringPoints[ptIdx];
            if (pulsePt) {
              const pRad = (isBeingHeld ? 7.5 : 5.2) * pulsePt.scale;
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = hTheme.rim;
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.arc(pulsePt.x, pulsePt.y, pRad, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }

          // E. Filamento Doble Hélice cuando el Hold está siendo pulsado
          if (isBeingHeld) {
            for (let strand = 0; strand < 2; strand++) {
              ctx.strokeStyle = strand === 0 ? '#ffffff' : '#ffe600';
              ctx.lineWidth = (strand === 0 ? 2.4 : 2.0) * stringPoints[segments].scale;
              ctx.beginPath();
              const phaseOffset = strand * Math.PI;
              for (let s = 0; s <= segments; s++) {
                const pt = stringPoints[s];
                const env = Math.sin((s / segments) * Math.PI);
                const helixX = pt.x + Math.sin(s * 0.95 - currentTime * 0.016 + phaseOffset) * (pt.halfW * 0.65 * env);
                if (s === 0) ctx.moveTo(helixX, pt.y);
                else ctx.lineTo(helixX, pt.y);
              }
              ctx.stroke();
            }
          }
          ctx.restore();

          // F. CAPUCHÓN TERMINAL 100% OPACO Y CON ALTO CONTRASTE
          const tailPt = stringPoints[0];
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
          const pinRad = (isLarge ? 11 : 7.5) * tailPt.scale;

          // Barra transversal de cierre con borde oscuro
          const barW = Math.max(12, (tailPt.laneW * 0.42));
          ctx.strokeStyle = hTheme.rim;
          ctx.lineWidth = Math.max(4.5, 7.5 * tailPt.scale);
          ctx.beginPath();
          ctx.moveTo(tailPt.x - barW, tailPt.y);
          ctx.lineTo(tailPt.x + barW, tailPt.y);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2.4, 4.2 * tailPt.scale);
          ctx.stroke();

          // Medallón sólido saturado en la punta del Hold
          ctx.fillStyle = hTheme.rim;
          ctx.beginPath();
          ctx.arc(tailPt.x, tailPt.y, pinRad * 1.55, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = holdCol;
          ctx.beginPath();
          ctx.arc(tailPt.x, tailPt.y, pinRad * 1.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.8, 2.8 * tailPt.scale);
          ctx.stroke();

          // Estrella diamante central blanca
          const starRot = currentTime * 0.004;
          ctx.save();
          ctx.translate(tailPt.x, tailPt.y);
          ctx.rotate(starRot);
          const sOuter = pinRad * 1.15;
          const sInner = pinRad * 0.38;
          ctx.beginPath();
          for (let pt = 0; pt < 8; pt++) {
            const rCur = (pt % 2 === 0) ? sOuter : sInner;
            const aCur = (pt / 8) * Math.PI * 2;
            const px = Math.cos(aCur) * rCur;
            const py = Math.sin(aCur) * rCur;
            if (pt === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();

          ctx.restore();

          // Cabeza del Hold
          const headPt = stringPoints[segments];
          const baseHoldKeyH = (this.numLanes === 4) ? (isLarge ? 64 : 28) : (isLarge ? 80 : 30);
          const headH = Math.min(baseHoldKeyH * headPt.scale, maxH3D);
          if (this.isMirrorModeActive && note._isMirrored) {
            this.renderMirrorReflectedNote(ctx, note, lane, headPt, headH, isLarge, false, 'up', lyricForNote, pHead, currentTime);
          } else {
            this.drawIvoryKey(ctx, lane, headPt.y, headH, headPt.scale, isBeingHeld, isLarge, false, lyricForNote);
          }

          ctx.restore();
        
        // ==========================================
        // 2. NOTAS SWIPE (DESLIZAMIENTO CON CHEVRÓN + ESTELA DE POLVO ESTELAR O BALDOSA DE ROCA CON HONDURA DE FLECHA)
        // ==========================================
        } else if (note.type === 'swipe') {
          const baseSwipeKeyH = (this.numLanes === 4) ? (isLarge ? 68 : 30) : (isLarge ? 84 : 32);
          const h = Math.min(baseSwipeKeyH * coord.scale, maxH3D);
          if (isRiverActive) {
            this.drawRiverStoneKey(ctx, drawLane, coord.y, h, coord.scale, false, isLarge, true, note.direction || 'up', lyricForNote, i, currentTime);
            continue;
          }
          // Estela aerodinámica de polvo estelar detrás de la tecla Swipe (0 allocs)
          if (pHead > 0.04 && pHead < 1.12) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const swipeDir = note.direction || 'up';
            const wakeCol = (this.activeSongPalette && this.activeSongPalette.glow) ? this.activeSongPalette.glow : '#00f2fe';
            for (let wIdx = 1; wIdx <= 3; wIdx++) {
              const pWake = Math.max(0.01, pHead - wIdx * 0.036);
              const wCoord = this.getPerspectiveCoord(lane, pWake, this._coordScratch1);
              const wakeAlpha = (0.38 - wIdx * 0.09) * Math.min(1, pHead * 1.8);
              if (wakeAlpha <= 0.02) continue;
              const wHalf = wCoord.laneW * (0.34 - wIdx * 0.05);
              const wY = wCoord.y - h * 0.45;
              ctx.strokeStyle = wIdx === 1 ? `rgba(255, 255, 255, ${wakeAlpha.toFixed(2)})` : hexToRgba(wakeCol, wakeAlpha);
              ctx.lineWidth = Math.max(1.2, (3.2 - wIdx * 0.6) * wCoord.scale);
              ctx.beginPath();
              if (swipeDir === 'left') {
                ctx.moveTo(wCoord.x + wHalf * 0.4, wY - 6 * wCoord.scale);
                ctx.lineTo(wCoord.x - wHalf * 0.5, wY);
                ctx.lineTo(wCoord.x + wHalf * 0.4, wY + 6 * wCoord.scale);
              } else if (swipeDir === 'right') {
                ctx.moveTo(wCoord.x - wHalf * 0.4, wY - 6 * wCoord.scale);
                ctx.lineTo(wCoord.x + wHalf * 0.5, wY);
                ctx.lineTo(wCoord.x - wHalf * 0.4, wY + 6 * wCoord.scale);
              } else {
                ctx.moveTo(wCoord.x - wHalf, wY + 5 * wCoord.scale);
                ctx.lineTo(wCoord.x, wY - 4 * wCoord.scale);
                ctx.lineTo(wCoord.x + wHalf, wY + 5 * wCoord.scale);
              }
              ctx.stroke();
            }
            ctx.restore();
          }
          if (this.isMirrorModeActive && note._isMirrored) {
            this.renderMirrorReflectedNote(ctx, note, drawLane, coord, h * mushHeightMult, isLarge, true, note.direction || 'up', lyricForNote, pHead, currentTime);
          } else {
            const swipeKey = this.drawIvoryKey(ctx, drawLane, coord.y, h * mushHeightMult, coord.scale, false, isLarge, true, lyricForNote);
            this.renderVectorChevron(ctx, swipeKey.cx, swipeKey.cy, note.direction || 'up', swipeKey.w, swipeKey.h);
          }

        // ==========================================
        // 3. NOTAS NORMALES (TAP ESTÁNDAR O BALDOSA DE ROCA FLOTANTE CON HONDURA CENTRAL)
        // ==========================================
        } else {
          const baseTapKeyH = (this.numLanes === 4) ? (isLarge ? 64 : 28) : (isLarge ? 80 : 30);
          const h = Math.min(baseTapKeyH * coord.scale * mushHeightMult, maxH3D);
          if (isRiverActive) {
            this.drawRiverStoneKey(ctx, drawLane, coord.y, h, coord.scale, false, isLarge, false, 'up', lyricForNote, i, currentTime);
            continue;
          }
          if (isAnnoyingDogActive && note._dogBatted) {
            const swipeP = note._dogSwipeP || 0.40;
            const fromL = note._dogFromLane ?? lane;
            if (pHead >= swipeP - 0.02 && pHead <= swipeP + 0.24 && fromL !== lane) {
              const origCoord = this.getPerspectiveCoord(fromL, pHead, this._coordScratch1);
              const trailAlpha = Math.max(0, 1 - Math.abs(pHead - (swipeP + 0.08)) / 0.16);
              ctx.save();
              ctx.strokeStyle = `rgba(251, 191, 36, ${(trailAlpha * 0.85).toFixed(2)})`;
              ctx.lineWidth = Math.max(2.2, 4.2 * coord.scale);
              ctx.beginPath();
              ctx.moveTo(origCoord.x, origCoord.y);
              ctx.quadraticCurveTo((origCoord.x + coord.x) * 0.5, origCoord.y - 22 * coord.scale, coord.x, coord.y);
              ctx.stroke();

              // 3 marcas de zarpazo doradas en el punto de golpeo
              const dirSign = lane > fromL ? 1 : -1;
              ctx.strokeStyle = `rgba(255, 255, 255, ${(trailAlpha * 0.92).toFixed(2)})`;
              ctx.lineWidth = Math.max(1.6, 2.8 * coord.scale);
              ctx.beginPath();
              for (let cl = -1; cl <= 1; cl++) {
                const sy = origCoord.y + cl * 7 * coord.scale;
                ctx.moveTo(origCoord.x - dirSign * 14 * coord.scale, sy - 5 * coord.scale);
                ctx.lineTo(origCoord.x + dirSign * 18 * coord.scale, sy + 4 * coord.scale);
              }
              ctx.stroke();
              ctx.restore();
            }
          }
          if (note.isMine) {
            this.renderMinesweeperKey(ctx, note, drawLane, coord.y, h, coord.scale, pHead, isLarge, currentTime);
            continue;
          }
          if (this.isMirrorModeActive && note._isMirrored) {
            this.renderMirrorReflectedNote(ctx, note, drawLane, coord, h, isLarge, false, 'up', lyricForNote, pHead, currentTime);
            continue;
          }
          if (isEchoActive && note._isEchoSource) {
            this.renderEchoSourceKey(ctx, note, drawLane, coord, h, isLarge, lyricForNote, pHead, currentTime);
            continue;
          }
          const tapKey = this.drawIvoryKey(ctx, drawLane, coord.y, h, coord.scale, false, isLarge, false, lyricForNote);
          // En modo Setas: si la tecla está saltando de carril o es múltiplo de 3, dibujar seta mágica sobre la tecla
          if (isMushroomActive && this._mushSprites && this._mushSprites.length > 0 && ((note._mushFromLane !== undefined && note._mushFromLane !== lane) || (i % 3 === 0))) {
            const spr = this._mushSprites[(note._mushColorIdx || 0) % this._mushSprites.length];
            const mSz = Math.max(16, 30 * coord.scale);
            ctx.drawImage(spr, tapKey.cx - mSz * 0.5, tapKey.cy - mSz * 0.5, mSz, mSz);
          } else if (isAnnoyingDogActive && note._dogBatted && this._dogPawPrintSprite) {
            // Sello de huella dorada (🐾) sobre las teclas que el Pomeranian empuja de un zarpazo
            const pSz = Math.max(16, 28 * coord.scale);
            ctx.drawImage(this._dogPawPrintSprite, tapKey.cx - pSz * 0.5, tapKey.cy - pSz * 0.5, pSz, pSz);
          }
        }
      }
    }

    // =========================================================================
    // MODO ESPEJO ("OJEPSƎ"): COREOGRAFÍA DIMENSIONAL, TECLAS REFLEJADAS Y ESPEJOS 3D
    // =========================================================================
    initMirrorModeAssets() {
      this._mirrorAssetsReady = true;
      if (!this._mirrorCrossBeams) this._mirrorCrossBeams = [];
    }

    _prepareMirrorChoreography() {
      this._mirrorWindows = [];
      if (!Array.isArray(this.notes) || this.notes.length === 0) return;

      // Crear ventanas periódicas de Dimensión Espejo:
      // Primeros 4.2s normales para calentar, luego alterna ~6.8s de Espejo ("OJEPSƎ") y ~5.6s normales
      let maxTimeMs = 0;
      for (let i = 0; i < this.notes.length; i++) {
        const t = this.notes[i].timestamp_ms ?? this.notes[i].timeMs ?? 0;
        if (t > maxTimeMs) maxTimeMs = t;
      }

      const rawWindows = [];
      let cursorMs = 4200;
      while (cursorMs < maxTimeMs + 2000) {
        const winStart = cursorMs;
        const winEnd = cursorMs + 6800;
        rawWindows.push({ startMs: winStart, endMs: winEnd, notes: [] });
        cursorMs = winEnd + 5600;
      }

      // Resetear e identificar las notas afectadas dentro de cada ventana Espejo
      for (let i = 0; i < this.notes.length; i++) {
        const n = this.notes[i];
        if (!n) continue;
        n._isMirrored = false;
        n._isMirrorStartKey = false;
        n._isMirrorEndKey = false;
        n._mirrorTargetLane = n.lane;
        if (n.isMine || (n.lane !== 0 && n.lane !== 2)) continue;
        const nt = n.timestamp_ms ?? n.timeMs ?? 0;
        for (let w = 0; w < rawWindows.length; w++) {
          const win = rawWindows[w];
          if (nt >= win.startMs + 260 && nt <= win.endMs - 260) {
            n._isMirrored = true;
            n._mirrorTargetLane = 2 - n.lane;
            win.notes.push(n);
            break;
          }
        }
      }

      // Ajustar cada ventana exactamente a su tecla de inicio y su tecla final para que se vea con total precisión dónde empieza y termina el efecto
      for (let w = 0; w < rawWindows.length; w++) {
        const win = rawWindows[w];
        if (win.notes.length === 0) continue;
        win.notes.sort((a, b) => ((a.timestamp_ms ?? a.timeMs ?? 0) - (b.timestamp_ms ?? b.timeMs ?? 0)));
        const firstNote = win.notes[0];
        const lastNote = win.notes[win.notes.length - 1];
        firstNote._isMirrorStartKey = true;
        lastNote._isMirrorEndKey = true;
        const firstT = firstNote.timestamp_ms ?? firstNote.timeMs ?? win.startMs;
        const lastT = lastNote.timestamp_ms ?? lastNote.timeMs ?? win.endMs;
        this._mirrorWindows.push({
          startMs: firstT,
          endMs: lastT,
          firstNote,
          lastNote
        });
      }
    }

    _isMirrorWindowActiveAt(timeMs) {
      if (!this._mirrorWindows || this._mirrorWindows.length === 0) return false;
      const approach = this.approachTimeMs || 1600;
      for (let i = 0; i < this._mirrorWindows.length; i++) {
        const w = this._mirrorWindows[i];
        if (timeMs >= w.startMs - approach * 0.85 && timeMs <= w.endMs + 140) return true;
      }
      return false;
    }

    updateMirrorModeEffects(dt) {
      const currentTime = this.getCurrentGameTimeMs(this._frameNow || performance.now());
      const inMirrorNow = this._isMirrorWindowActiveAt(currentTime);
      if (inMirrorNow !== this._lastMirrorActiveState) {
        this._lastMirrorActiveState = inMirrorNow;
        this._mirrorFlipWave = 1.0;
        if (this.synth && typeof this.synth.playPianoChime === 'function') {
          try {
            const actx = this.synth.ensureContext();
            if (actx) this.synth.playPianoChime(actx.currentTime);
          } catch (_) {}
        }
      }
      const targetProg = inMirrorNow ? 1.0 : 0.0;
      this._mirrorPhaseProgress = (this._mirrorPhaseProgress || 0) + (targetProg - (this._mirrorPhaseProgress || 0)) * Math.min(1, dt * 4.5);
      if (this._mirrorFlipWave > 0) {
        this._mirrorFlipWave = Math.max(0, this._mirrorFlipWave - dt * 1.6);
      }
      if (this._mirrorCrossBeams && this._mirrorCrossBeams.length > 0) {
        for (let i = this._mirrorCrossBeams.length - 1; i >= 0; i--) {
          const b = this._mirrorCrossBeams[i];
          b.age += dt;
          if (b.age >= b.duration) {
            this._mirrorCrossBeams.splice(i, 1);
          }
        }
      }
    }

    // Dibuja en el suelo de la autopista 3D la animación de cruce de los carriles exteriores (Carril 1 <-> Carril 3):
    // Nace desde arriba del todo de la pista (horizonY) con un degradado suave sin cortes bruscos y optimizado a 60 FPS
    renderMirrorTrackWeave(ctx, currentTime, horizonY, hitY, bottomY) {
      const rawP = this._mirrorPhaseProgress || 0;
      if (rawP <= 0.01) return;

      const easeP = rawP < 0.5
        ? 4 * rawP * rawP * rawP
        : 1 - Math.pow(-2 * rawP + 2, 3) / 2;

      const t = (currentTime >= 0 ? currentTime : performance.now()) * 0.001;
      const yCrossStart = horizonY;
      const yCrossEnd = hitY;
      const spanCrossY = Math.max(10, yCrossEnd - yCrossStart);

      const steps = 14;
      ctx.save();

      const streams = [
        {
          startLane: 0,
          endLane: 2,
          rgb: '6, 182, 212',
          railHex: '#22d3ee'
        },
        {
          startLane: 2,
          endLane: 0,
          rgb: '236, 72, 153',
          railHex: '#f472b6'
        }
      ];

      // Función suave de curva en S que mantiene los carriles rectos en el horizonte superior y los cruza con elegancia hacia la mitad inferior
      const computeCurveS = (u) => {
        const remap = Math.max(0, Math.min(1, (u - 0.16) / 0.80));
        return remap * remap * (3 - 2 * remap);
      };

      for (let sIdx = 0; sIdx < 2; sIdx++) {
        const st = streams[sIdx];
        const laneDelta = (st.endLane - st.startLane) * easeP;

        // 1. Alfombra luminosa 3D desde arriba del todo (horizonY) con degradado suave en el origen
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const sCurve = computeCurveS(u);
          const vLane = st.startLane + laneDelta * sCurve;
          const y = yCrossStart + spanCrossY * u;
          const xL = this.getLaneBoundaryX(vLane + 0.07, y);
          if (i === 0) ctx.moveTo(xL, y);
          else ctx.lineTo(xL, y);
        }
        for (let i = steps; i >= 0; i--) {
          const u = i / steps;
          const sCurve = computeCurveS(u);
          const vLane = st.startLane + laneDelta * sCurve;
          const y = yCrossStart + spanCrossY * u;
          const xR = this.getLaneBoundaryX(vLane + 0.93, y);
          ctx.lineTo(xR, y);
        }
        ctx.closePath();

        const ribbonGrad = ctx.createLinearGradient(0, yCrossStart, 0, yCrossEnd);
        ribbonGrad.addColorStop(0.0, `rgba(${st.rgb}, 0.0)`);
        ribbonGrad.addColorStop(0.18, `rgba(${st.rgb}, ${(0.12 * easeP).toFixed(3)})`);
        ribbonGrad.addColorStop(0.55, `rgba(${st.rgb}, ${(0.25 * easeP).toFixed(3)})`);
        ribbonGrad.addColorStop(1.0, `rgba(${st.rgb}, ${(0.36 * easeP).toFixed(3)})`);
        ctx.fillStyle = ribbonGrad;
        ctx.fill();

        // 2. Raíles laterales con degradado desde arriba del todo (sin cortes bruscos)
        const railGrad = ctx.createLinearGradient(0, yCrossStart, 0, yCrossEnd);
        railGrad.addColorStop(0.0, `rgba(${st.rgb}, 0.0)`);
        railGrad.addColorStop(0.20, `rgba(${st.rgb}, ${(0.45 * easeP).toFixed(3)})`);
        railGrad.addColorStop(1.0, `rgba(${st.rgb}, ${(0.92 * easeP).toFixed(3)})`);
        ctx.strokeStyle = railGrad;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const sCurve = computeCurveS(u);
          const vLane = st.startLane + laneDelta * sCurve;
          const y = yCrossStart + spanCrossY * u;
          const xL = this.getLaneBoundaryX(vLane + 0.07, y);
          if (i === 0) ctx.moveTo(xL, y);
          else ctx.lineTo(xL, y);
        }
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const sCurve = computeCurveS(u);
          const vLane = st.startLane + laneDelta * sCurve;
          const y = yCrossStart + spanCrossY * u;
          const xR = this.getLaneBoundaryX(vLane + 0.93, y);
          if (i === 0) ctx.moveTo(xR, y);
          else ctx.lineTo(xR, y);
        }
        ctx.stroke();

        // 3. 3 Chevrons ligeros de dirección viajando por el carril
        const numChevrons = 3;
        const flowSpeed = (t * 1.15) % 1.0;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.55 * easeP).toFixed(2)})`;
        ctx.lineWidth = 2.0;
        for (let c = 0; c < numChevrons; c++) {
          const uChev = ((c / numChevrons) + flowSpeed) % 1.0;
          if (uChev < 0.18 || uChev > 0.94) continue;
          const sCurve = computeCurveS(uChev);
          const vLane = st.startLane + laneDelta * sCurve;
          const yC = yCrossStart + spanCrossY * uChev;
          const xCenter = this.getLaneBoundaryX(vLane + 0.5, yC);
          const laneWAtY = this.getLaneBoundaryX(vLane + 0.72, yC) - this.getLaneBoundaryX(vLane + 0.28, yC);
          const hw = laneWAtY * 0.34;
          const hh = Math.max(3.5, 7.5 * uChev);
          ctx.beginPath();
          ctx.moveTo(xCenter - hw, yC - hh);
          ctx.lineTo(xCenter, yC + hh * 0.55);
          ctx.lineTo(xCenter + hw, yC - hh);
          ctx.stroke();
        }
      }

      // Indicador limpio de color en la barra receptora inferior (Rosa a la izquierda, Cian a la derecha)
      if (easeP > 0.1) {
        const padLeftCx = (this.getLaneBoundaryX(0, hitY) + this.getLaneBoundaryX(1, hitY)) * 0.5;
        const padRightCx = (this.getLaneBoundaryX(2, hitY) + this.getLaneBoundaryX(3, hitY)) * 0.5;
        const padW = (this.getLaneBoundaryX(1, hitY) - this.getLaneBoundaryX(0, hitY)) * 0.42;

        ctx.strokeStyle = `rgba(244, 114, 182, ${(0.85 * easeP).toFixed(2)})`;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(padLeftCx - padW, hitY);
        ctx.lineTo(padLeftCx + padW, hitY);
        ctx.stroke();

        ctx.strokeStyle = `rgba(34, 211, 238, ${(0.85 * easeP).toFixed(2)})`;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(padRightCx - padW, hitY);
        ctx.lineTo(padRightCx + padW, hitY);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Dibuja cada tecla afectada por el espejo cambiando directamente el color 3D nativo de la propia tecla (Cian en carril 1 -> botón 3, Rosa en carril 3 -> botón 1) sin rectángulos superpuestos y a 60 FPS
    renderMirrorReflectedNote(ctx, note, drawLane, coord, h, isLarge, isSwipe, swipeDir, lyricForNote, pHead, currentTime) {
      const mirrorSide = (drawLane === 0) ? 'cyan' : 'pink';
      const keyRect = this.drawIvoryKey(ctx, drawLane, coord.y, h, coord.scale, false, isLarge, isSwipe, lyricForNote, mirrorSide);
      if (isSwipe) {
        this.renderVectorChevron(ctx, keyRect.cx, keyRect.cy, swipeDir, keyRect.w, keyRect.h);
      }
    }

    // Dibuja únicamente el destello de energía cruzada cuando se acierta una tecla en modo espejo
    renderMirrorModeOverlay(ctx, currentTime) {
      if (!this._mirrorCrossBeams || this._mirrorCrossBeams.length === 0) return;
      const midX = this.width * 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this._mirrorCrossBeams.length; i++) {
        const b = this._mirrorCrossBeams[i];
        const prog = Math.min(1, b.age / b.duration);
        const alpha = (1 - prog) * 0.88;
        ctx.strokeStyle = `rgba(0, 242, 254, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 4.2 * (1 - prog * 0.5);
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.y);
        ctx.quadraticCurveTo(midX, b.y - 28 * Math.sin(prog * Math.PI), b.toX, b.y);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      ctx.restore();
    }

    // =========================================================================
    // MODO ECO ("DOBLE GOLPE CON REBOTE CORTO"): ONDA ACÚSTICA Y PARÁBOLA 1/4 PANTALLA
    // =========================================================================
    initEchoModeAssets() {
      if (!this._echoRipples) this._echoRipples = [];
      if (this._echoWaveSprites) return;

      // Pre-renderizar emblemas de onda acústica / muelle en offscreen canvas (0 allocs en el bucle de renderizado)
      const buildEchoBadge = (dirDelta, isRebound) => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 52;
        const g = c.getContext('2d');
        const cx = 64;
        const cy = 26;

        // Halo suave central
        const rad = g.createRadialGradient(cx, cy, 2, cx, cy, 34);
        rad.addColorStop(0, isRebound ? 'rgba(255, 255, 255, 0.55)' : 'rgba(167, 243, 208, 0.45)');
        rad.addColorStop(0.55, isRebound ? 'rgba(56, 189, 248, 0.22)' : 'rgba(16, 185, 129, 0.18)');
        rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.fillStyle = rad;
        g.fillRect(0, 0, 128, 52);

        // Espiral / muelle armónico central horizontal + núcleo acústico
        g.strokeStyle = isRebound ? '#e0f2fe' : '#a7f3d0';
        g.lineWidth = 2.2;
        g.lineCap = 'round';
        g.lineJoin = 'round';

        // 2 pares de arcos de onda acústica concéntricos (( • ))
        for (let ring = 1; ring <= 2; ring++) {
          const r = ring === 1 ? 10.5 : 17.5;
          g.strokeStyle = ring === 1 ? '#ffffff' : (isRebound ? '#7dd3fc' : '#6ee7b7');
          g.lineWidth = ring === 1 ? 2.5 : 2.0;
          // Arco izquierdo
          g.beginPath();
          g.arc(cx - 2, cy, r, Math.PI * 0.68, Math.PI * 1.32);
          g.stroke();
          // Arco derecho
          g.beginPath();
          g.arc(cx + 2, cy, r, -Math.PI * 0.32, Math.PI * 0.32);
          g.stroke();
        }

        // Bobina de muelle elástico en el centro
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2.1;
        g.beginPath();
        g.moveTo(cx - 6, cy + 4);
        g.lineTo(cx + 6, cy + 2);
        g.lineTo(cx - 5, cy - 1);
        g.lineTo(cx + 5, cy - 4);
        g.stroke();

        // Punto focal brillante
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(cx, cy, 3.2, 0, Math.PI * 2);
        g.fill();

        // Indicador direccional sutil si el rebote cae en el carril adyacente (izquierda o derecha)
        if (dirDelta !== 0 && !isRebound) {
          const arrowX = dirDelta < 0 ? (cx - 30) : (cx + 30);
          const sign = dirDelta < 0 ? -1 : 1;
          g.strokeStyle = '#ffffff';
          g.lineWidth = 2.6;
          g.beginPath();
          g.moveTo(arrowX - sign * 4, cy - 6);
          g.lineTo(arrowX + sign * 3, cy);
          g.lineTo(arrowX - sign * 4, cy + 6);
          g.stroke();
        }
        return c;
      };

      this._echoWaveSprites = {
        same: buildEchoBadge(0, false),
        left: buildEchoBadge(-1, false),
        right: buildEchoBadge(1, false),
        rebound: buildEchoBadge(0, true)
      };
    }

    _prepareEchoChoreography() {
      if (!Array.isArray(this.notes) || this.notes.length === 0) return;

      // Filtrar notas previas que fuesen inyectadas por ECO en un reinicio
      const baseNotes = this.notes.filter(n => n && !n._isSyntheticEchoRebound);
      for (let i = 0; i < baseNotes.length; i++) {
        const n = baseNotes[i];
        n._isEchoSource = false;
        n._isEchoRebound = false;
        n._echoTargetNote = null;
        n._echoSourceNote = null;
        n._echoFromLane = n.lane;
        n._echoSourceTimeMs = 0;
        n._echoBeats = 1;
        n._echoBounceLaunched = false;
        n._echoLaunchTimeMs = 0;
      }

      const nLanes = this.numLanes || 3;
      const rawBpm = Math.max(68, Math.min(188, Number(this.bpm || this.beatmapData?.metadata?.bpm || this.beatmapData?.bpm || 120)));
      let beatMs = Math.round(60000 / rawBpm);
      if (beatMs < 330) beatMs *= 2;
      else if (beatMs > 660) beatMs = Math.round(beatMs * 0.5);

      const isTapCandidate = (n) => {
        if (!n || n.isMine || n._isEchoSource || n._isEchoRebound) return false;
        const t = n.type || 'tap';
        return (t === 'tap' || t === 'single' || t === 'normal');
      };

      const isLaneBusyAt = (lane, tMs, marginMs = 255) => {
        for (let i = 0; i < baseNotes.length; i++) {
          const rn = baseNotes[i];
          if (!rn) continue;
          const rtStart = rn.timestamp_ms ?? rn.timeMs ?? 0;
          const rtEnd = rn.end_timestamp_ms || rtStart;
          if (rtStart - tMs > marginMs + 350) break;
          if (rn.lane === lane && tMs >= (rtStart - marginMs) && tMs <= (rtEnd + marginMs)) {
            return true;
          }
        }
        return false;
      };

      const countBusyLanesAt = (tMs, marginMs = 185) => {
        let busy = 0;
        for (let l = 0; l < nLanes; l++) {
          if (isLaneBusyAt(l, tMs, marginMs)) busy++;
        }
        return busy;
      };

      const syntheticRebounds = [];
      const lastSongNoteT = (baseNotes[baseNotes.length - 1]?.timestamp_ms ?? 0) - 900;
      let nextAllowedEchoMs = 2100;
      let echoPairIdx = 0;

      for (let i = 0; i < baseNotes.length; i++) {
        const src = baseNotes[i];
        if (!isTapCandidate(src)) continue;
        const srcT = src.timestamp_ms ?? src.timeMs ?? 0;
        if (srcT < nextAllowedEchoMs || srcT > lastSongNoteT) continue;

        // Evitar convertir acordes simultáneos en tecla muelle para que el pulso sea cristalino
        const prevT = i > 0 ? (baseNotes[i - 1].timestamp_ms ?? -9999) : -9999;
        const nextImmediateT = (i + 1 < baseNotes.length) ? (baseNotes[i + 1].timestamp_ms ?? 99999999) : 99999999;
        if (Math.abs(srcT - prevT) < 90 || Math.abs(nextImmediateT - srcT) < 90) continue;

        // 1. Intentar enlazar con una nota tap real existente 1 o 2 pulsos musicales después en el mismo carril o adyacente
        let linkedExisting = null;
        for (let j = i + 1; j < baseNotes.length; j++) {
          const cand = baseNotes[j];
          if (!cand) continue;
          const candT = cand.timestamp_ms ?? cand.timeMs ?? 0;
          const dt = candT - srcT;
          if (dt < 310) continue;
          if (dt > 980) break;
          if (!isTapCandidate(cand)) continue;

          const laneDist = Math.abs((cand.lane ?? 0) - (src.lane ?? 0));
          if (laneDist > 1) continue;

          const near1Beat = Math.abs(dt - beatMs) <= beatMs * 0.34;
          const near2Beats = Math.abs(dt - beatMs * 2) <= beatMs * 0.32;
          if (!near1Beat && !near2Beats) continue;

          // Verificar que no haya una nota intermedia estorbando en el carril origen o destino
          let blockedBetween = false;
          for (let k = i + 1; k < j; k++) {
            const midN = baseNotes[k];
            if (midN && (midN.lane === src.lane || midN.lane === cand.lane)) {
              blockedBetween = true;
              break;
            }
          }
          if (!blockedBetween) {
            linkedExisting = cand;
            break;
          }
        }

        if (linkedExisting) {
          const rebT = linkedExisting.timestamp_ms ?? linkedExisting.timeMs ?? (srcT + beatMs);
          const dt = rebT - srcT;
          src._isEchoSource = true;
          src._echoTargetNote = linkedExisting;
          linkedExisting._isEchoRebound = true;
          linkedExisting._echoSourceNote = src;
          linkedExisting._echoFromLane = src.lane;
          linkedExisting._echoSourceTimeMs = srcT;
          linkedExisting._echoBeats = (dt > beatMs * 1.45) ? 2 : 1;
          linkedExisting._echoBounceLaunched = false;
          linkedExisting._echoLaunchTimeMs = 0;
          echoPairIdx++;
          nextAllowedEchoMs = rebT + 1350 + (echoPairIdx % 3) * 320;
          continue;
        }

        // 2. Si hay hueco musical tras src, generar rebote de contratiempo exactamente 1 o 2 pulsos después
        const beats = (beatMs < 380) ? 2 : (((echoPairIdx % 3) === 2 && beatMs <= 470) ? 2 : 1);
        const reboundDt = Math.max(350, Math.min(880, Math.round(beatMs * beats)));
        const reboundTime = srcT + reboundDt;
        if (reboundTime > lastSongNoteT) continue;
        if (countBusyLanesAt(reboundTime, 190) >= nLanes - 1) continue;

        // Alternar entre el mismo carril y el carril de al lado para crear el contratiempo rítmico
        const preferAdjacent = (echoPairIdx % 2 === 0);
        const adjLanes = [];
        if (src.lane > 0) adjLanes.push(src.lane - 1);
        if (src.lane < nLanes - 1) adjLanes.push(src.lane + 1);
        if ((echoPairIdx & 1) && adjLanes.length > 1) adjLanes.reverse();

        const candidateLanes = preferAdjacent ? [...adjLanes, src.lane] : [src.lane, ...adjLanes];
        let chosenLane = -1;
        for (let cIdx = 0; cIdx < candidateLanes.length; cIdx++) {
          const l = candidateLanes[cIdx];
          if (!isLaneBusyAt(l, reboundTime, 275)) {
            chosenLane = l;
            break;
          }
        }

        if (chosenLane !== -1) {
          const rebNote = {
            id: `echo_reb_${echoPairIdx}_${reboundTime}`,
            lane: chosenLane,
            column: chosenLane,
            track: chosenLane,
            type: 'tap',
            isMine: false,
            time: reboundTime / 1000,
            timeMs: reboundTime,
            timestamp_ms: reboundTime,
            duration_ms: 0,
            holdDuration: 0,
            end_timestamp_ms: null,
            lyric: null,
            _cleanLyric: null,
            hit: false,
            holding: false,
            holdCompleted: false,
            missed: false,
            processed: false,
            _isSyntheticEchoRebound: true,
            _isEchoRebound: true,
            _echoSourceNote: src,
            _echoFromLane: src.lane,
            _echoSourceTimeMs: srcT,
            _echoBeats: beats,
            _echoBounceLaunched: false,
            _echoLaunchTimeMs: 0
          };
          src._isEchoSource = true;
          src._echoTargetNote = rebNote;
          syntheticRebounds.push(rebNote);
          echoPairIdx++;
          nextAllowedEchoMs = reboundTime + 1350 + (echoPairIdx % 3) * 320;
        }
      }

      if (syntheticRebounds.length > 0) {
        const combined = [...baseNotes, ...syntheticRebounds].sort((a, b) => (a.timestamp_ms ?? 0) - (b.timestamp_ms ?? 0));
        const cLen = combined.length;
        for (let i = 0; i < cLen; i++) {
          const curN = combined[i];
          let diff = Infinity;
          const maxJ = Math.min(cLen, i + 40);
          for (let j = i + 1; j < maxJ; j++) {
            const nextN = combined[j];
            if ((nextN.timestamp_ms ?? 0) - (curN.timestamp_ms ?? 0) > 3000) break;
            if (nextN.lane === curN.lane && (nextN.timestamp_ms ?? 0) > (curN.timestamp_ms ?? 0)) {
              diff = (nextN.timestamp_ms ?? 0) - (curN.timestamp_ms ?? 0);
              break;
            }
          }
          curN.nextSameLaneDiffMs = diff;
        }
        this.notes = combined;
        this.lastNoteTime = combined.length > 0
          ? Math.max(...combined.map(n => n.end_timestamp_ms || n.timestamp_ms || 0))
          : 0;
      } else {
        this.notes = baseNotes;
      }
    }

    _launchEchoRebound(sourceNote, currentTime, hitX, hitY, isFallback = false) {
      if (!sourceNote || !sourceNote._echoTargetNote) return;
      const reb = sourceNote._echoTargetNote;
      if (reb._echoBounceLaunched) return;

      reb._echoBounceLaunched = true;
      const targetT = reb.timestamp_ms ?? reb.timeMs ?? (currentTime + 450);
      reb._echoLaunchTimeMs = Math.min(currentTime, targetT - 200);

      const srcLane = sourceNote.lane ?? 0;
      const dstLane = reb.lane ?? srcLane;
      const yBar = Number.isFinite(hitY) ? hitY : (Number.isFinite(this.hitLineY) ? this.hitLineY : (this.height * 0.84));
      const xStart = Number.isFinite(hitX)
        ? hitX
        : ((this.visualDimension !== '2d' && typeof this.getLaneBoundaryX === 'function')
            ? (this.getLaneBoundaryX(srcLane, yBar) + this.getLaneBoundaryX(srcLane + 1, yBar)) * 0.5
            : (srcLane + 0.5) * (this.laneWidth || (this.width / (this.numLanes || 3))));

      if (!this._echoRipples) this._echoRipples = [];
      if (this._echoRipples.length >= 8) this._echoRipples.shift();
      this._echoRipples.push({
        x: xStart,
        y: yBar,
        age: 0,
        duration: 0.36,
        maxRadius: Math.max(46, (this.laneWidth || 100) * 0.56),
        color: '#34d399'
      });

      if (!isFallback) {
        this._playEchoSpringSound(srcLane, dstLane, reb._echoBeats || 1, false);
      }
    }

    _triggerEchoReboundHitFX(reboundNote, hitX, hitY) {
      const lane = reboundNote?.lane ?? 0;
      if (!this._echoRipples) this._echoRipples = [];
      if (this._echoRipples.length >= 8) this._echoRipples.shift();
      this._echoRipples.push({
        x: hitX,
        y: hitY,
        age: 0,
        duration: 0.42,
        maxRadius: Math.max(58, (this.laneWidth || 100) * 0.68),
        color: '#38bdf8'
      });
      this._playEchoSpringSound(lane, lane, 1, true);
    }

    _playEchoSpringSound(fromLane, toLane, beats = 1, isSecondHit = false) {
      try {
        if (this.synth && this.synth.isMuted) return;
        const actx = (this.synth && typeof this.synth.ensureContext === 'function') ? this.synth.ensureContext() : null;
        if (!actx) return;
        const now = actx.currentTime;
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        const baseFreqs = [523.25, 659.25, 783.99, 987.77];
        const f0 = baseFreqs[Math.abs(fromLane) % baseFreqs.length];
        const f1 = baseFreqs[Math.abs(toLane) % baseFreqs.length] * (isSecondHit ? 1.5 : 1.25);

        osc.frequency.setValueAtTime(f0, now);
        osc.frequency.exponentialRampToValueAtTime(f1, now + (isSecondHit ? 0.085 : 0.11));

        gain.gain.setValueAtTime(0.065, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isSecondHit ? 0.11 : 0.13));

        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + (isSecondHit ? 0.115 : 0.135));
      } catch (_) {}
    }

    updateEchoModeEffects(dt) {
      if (!this._echoRipples || this._echoRipples.length === 0) return;
      for (let i = this._echoRipples.length - 1; i >= 0; i--) {
        const r = this._echoRipples[i];
        r.age += dt;
        if (r.age >= r.duration) {
          this._echoRipples.splice(i, 1);
        }
      }
    }

    renderEchoSourceKey(ctx, note, drawLane, coord, h, isLarge, lyricForNote, pHead, currentTime) {
      if (!this._echoWaveSprites) this.initEchoModeAssets();
      const keyRect = this.drawIvoryKey(ctx, drawLane, coord.y, h, coord.scale, false, isLarge, false, lyricForNote, 'echo_source');
      if (!lyricForNote && this._echoWaveSprites) {
        const targetL = note._echoTargetNote ? (note._echoTargetNote.lane ?? drawLane) : drawLane;
        const delta = Math.round(targetL - drawLane);
        const spr = delta < 0 ? this._echoWaveSprites.left : (delta > 0 ? this._echoWaveSprites.right : this._echoWaveSprites.same);
        const pulse = 1.0 + 0.07 * Math.sin(currentTime * 0.014 + (note.timestamp_ms || 0) * 0.01);
        const w = Math.min(keyRect.w * 0.86, 84 * coord.scale) * pulse;
        const bh = w * (52 / 128);
        ctx.drawImage(spr, keyRect.cx - w * 0.5, keyRect.cy - bh * 0.5, w, bh);
      }
    }

    renderEchoBouncingNote(ctx, note, currentTime, hitY, isLarge, lyricForNote) {
      if (!this._echoWaveSprites) this.initEchoModeAssets();
      const launchT = note._echoLaunchTimeMs || note._echoSourceTimeMs || (note.timestamp_ms - 450);
      const targetT = note.timestamp_ms ?? note.timeMs ?? (launchT + 450);
      const flightDur = Math.max(180, targetT - launchT);
      const u = (currentTime - launchT) / flightDur;
      if (u < -0.05 || u > 1.24) return;

      const fromLane = note._echoFromLane ?? note.lane ?? 0;
      const toLane = note.lane ?? fromLane;
      const uClamped = Math.max(0, Math.min(1, u));
      // Interpolación horizontal suave hacia el mismo carril o el carril de al lado
      const curLane = fromLane + (toLane - fromLane) * (uClamped * (2 - uClamped));

      // Parábola corta con gravedad: sube exactamente 1/4 de la pantalla (0.25 * height) en el ápice (u = 0.5) y cae en u = 1.0
      const peakRisePx = this.height * 0.25;
      const parabola = (u <= 1.0)
        ? (4.0 * u * (1.0 - u))
        : (-2.15 * (u - 1.0));
      const curY = hitY - peakRisePx * parabola;

      const xFrom = (this.visualDimension !== '2d' && typeof this.getLaneBoundaryX === 'function')
        ? (this.getLaneBoundaryX(fromLane, hitY) + this.getLaneBoundaryX(fromLane + 1, hitY)) * 0.5
        : (fromLane + 0.5) * this.laneWidth;
      const xTo = (this.visualDimension !== '2d' && typeof this.getLaneBoundaryX === 'function')
        ? (this.getLaneBoundaryX(toLane, hitY) + this.getLaneBoundaryX(toLane + 1, hitY)) * 0.5
        : (toLane + 0.5) * this.laneWidth;

      ctx.save();
      // 1. Arco guía parabólico minimalista y diana acústica en el carril receptor de aterrizaje
      if (u <= 1.05) {
        const arcAlpha = Math.max(0.08, (1.0 - Math.max(0, u - 0.85) * 4.5) * 0.46);
        ctx.strokeStyle = `rgba(52, 211, 153, ${arcAlpha.toFixed(2)})`;
        ctx.lineWidth = 2.0;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(xFrom, hitY);
        ctx.quadraticCurveTo((xFrom + xTo) * 0.5, hitY - peakRisePx * 2.0, xTo, hitY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Diana de onda acústica en el receptor de destino que se contrae al compás de la caída
        const landRx = Math.max(16, (this.laneWidth || 96) * (0.18 + 0.22 * (1.0 - uClamped)));
        const landRy = landRx * 0.50;
        const landAlpha = 0.30 + 0.60 * uClamped;
        ctx.strokeStyle = uClamped > 0.82 ? `rgba(255, 255, 255, ${landAlpha.toFixed(2)})` : `rgba(56, 189, 248, ${landAlpha.toFixed(2)})`;
        ctx.lineWidth = uClamped > 0.82 ? 2.8 : 2.0;
        ctx.beginPath();
        if (ctx.ellipse) {
          ctx.ellipse(xTo, hitY, landRx, landRy, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(xTo, hitY, landRy, 0, Math.PI * 2);
        }
        ctx.stroke();
      }

      // 2. Dos ondas sónicas ligeras de estela detrás de la tecla en pleno rebote (0 allocs)
      for (let wIdx = 1; wIdx <= 2; wIdx++) {
        const uTrail = uClamped - wIdx * 0.065;
        if (uTrail <= 0.02 || uTrail >= 0.98) continue;
        const trailLane = fromLane + (toLane - fromLane) * (uTrail * (2 - uTrail));
        const trailY = hitY - peakRisePx * (4.0 * uTrail * (1.0 - uTrail));
        const trailX = (this.visualDimension !== '2d' && typeof this.getLaneBoundaryX === 'function')
          ? (this.getLaneBoundaryX(trailLane, trailY) + this.getLaneBoundaryX(trailLane + 1, trailY)) * 0.5
          : (trailLane + 0.5) * this.laneWidth;
        const trailAlpha = (0.34 - wIdx * 0.11);
        ctx.strokeStyle = wIdx === 1 ? `rgba(167, 243, 208, ${trailAlpha.toFixed(2)})` : `rgba(56, 189, 248, ${trailAlpha.toFixed(2)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        if (ctx.ellipse) {
          ctx.ellipse(trailX, trailY, 22 - wIdx * 4, 8 - wIdx * 1.5, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 3. Dibujar la tecla en rebote con ligera perspectiva y elasticidad de muelle
      const horizonY = 12;
      const tPersp = Math.max(0.25, Math.min(1.12, (curY - horizonY) / Math.max(1, hitY - horizonY)));
      const minScale = (this.numLanes === 4) ? 0.25 : 0.22;
      const bounceScale = (minScale + (1.0 - minScale) * tPersp) * (1.0 + 0.08 * parabola);
      const baseTapKeyH = (this.numLanes === 4) ? (isLarge ? 64 : 28) : (isLarge ? 80 : 30);
      const keyH = baseTapKeyH * bounceScale;

      const keyRect = this.drawIvoryKey(ctx, curLane, curY, keyH, bounceScale, false, isLarge, false, lyricForNote, 'echo_rebound');
      if (!lyricForNote && this._echoWaveSprites && this._echoWaveSprites.rebound) {
        const w = Math.min(keyRect.w * 0.86, 86 * bounceScale);
        const bh = w * (52 / 128);
        ctx.drawImage(this._echoWaveSprites.rebound, keyRect.cx - w * 0.5, keyRect.cy - bh * 0.5, w, bh);
      }
    }

    renderEchoModeOverlay(ctx, currentTime) {
      if (!this._echoRipples || this._echoRipples.length === 0) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this._echoRipples.length; i++) {
        const r = this._echoRipples[i];
        const p = Math.min(1, r.age / r.duration);
        const alpha = (1 - p) * 0.82;
        const rx = 14 + (r.maxRadius - 14) * (1 - (1 - p) * (1 - p));
        const ry = rx * 0.52;
        ctx.strokeStyle = r.color === '#38bdf8'
          ? `rgba(56, 189, 248, ${alpha.toFixed(2)})`
          : `rgba(52, 211, 153, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 2.8 * (1 - p * 0.5);
        ctx.beginPath();
        if (ctx.ellipse) {
          ctx.ellipse(r.x, r.y, rx, ry, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(r.x, r.y, ry, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    renderJudgements() {
      const ctx = this.ctx;
      const len = this.judgements.length;
      if (len === 0) return;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 22px "Outfit", system-ui, sans-serif';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 0;

      for (let i = 0; i < len; i++) {
        const j = this.judgements[i];
        if (!j || !j.text || j.alpha <= 0.01) continue;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, j.alpha));
        const drawX = (typeof j.x === 'number') ? j.x : (this.width / 2);
        ctx.translate(drawX, j.y);
        const s = j.scale || 1;
        ctx.scale(s, s);

        ctx.strokeStyle = '#040207';
        ctx.lineWidth = 5.5;
        ctx.strokeText(j.text, 0, 0);

        ctx.fillStyle = j.color || '#ffffff';
        ctx.fillText(j.text, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    startLoop() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      this.isRunning = true;
      let lastTime = performance.now();

      const loop = (now) => {
        if (!this.isRunning || this.isPaused || this.isRewinding) {
          this.animFrameId = null;
          return;
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        this._frameNow = now;

        try {
          this.update(dt, now);
          this.render(now);
        } catch (err) {
          console.error('Error inside render loop:', err);
        }

        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }
}

  // Exportación al objeto global
window.BeatstarEngine = BeatstarEngine;
window.DirectAudioSync = DirectAudioSync;
window.ParticleSystem = ParticleSystem;
window.HighFidelityAudioPlayer = HighFidelityAudioPlayer;